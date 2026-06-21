import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { NonRetriableError } from "inngest";
import { Octokit } from "octokit";
import z from "zod";

interface ExportGithubRepoEvent {
  projectId: string;
  repoName: string;
  visibility: "public" | "private";

  githubToken: string;
  description: string;
}

type FileWithUrl = Doc<"files"> & {
  storageUrl: string | null;
};

export const ExportToGithub = inngest.createFunction(
  {
    id: "export-to-github",
    cancelOn: [
      {
        event: "github/export.cancel",
        if: "event.data.projectId == async.data.projectId",
      },
    ],

    onFailure: async ({ event, step }) => {
      const internalKey = process.env.CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ExportGithubRepoEvent;

      await step.run("set-failed-status", async () => {
        await convex.mutation(api.system.updateExportStatus, {
          internalKey,
          projectId: projectId as Id<"projects">,
          status: "failed",
        });
      });
    },
    triggers: [{ event: "github/export.repo" }],
  },
  async ({ event, step }) => {
    const { projectId, repoName, visibility, description, githubToken } =
      event.data as ExportGithubRepoEvent;
    const internalKey = process.env.CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("Internal key not configured");
    }
    await step.run("set-exporting-status", async () => {
      await convex.mutation(api.system.updateExportStatus, {
        internalKey,
        projectId: projectId as Id<"projects">,
        status: "exporting",
      });
    });
    const octokit = new Octokit({ auth: githubToken });

    // Get authenticated user
    const { data: user } = await step.run("get-github-user", async () => {
      return await octokit.rest.users.getAuthenticated();
    });

    const { data: repo } = await step.run("create-repo", async () => {
      return await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: description,
        private: visibility === "private",
      });
    });

    // Wait for GitHub to initialize the repo (auto_init is async on GitHub's side)
    await step.sleep("wait-for-repo-init", "3s");

    // Get the initial commit SHA (we need this as parent for our commit)
    const initialCommitSha = await step.run(
      "get-initial-commit-sha",
      async () => {
        const { data: refData } = await octokit.rest.git.getRef({
          owner: user.login,
          repo: repo.name,
          ref: "heads/main",
        });
        return refData.object.sha;
      },
    );

    const files = await step.run("fetch-project-files", async () => {
      return (await convex.query(api.system.getProjectFilesWithUrls, {
        internalKey,
        projectId: projectId as Id<"projects">,
      })) as FileWithUrl[];
    });

    const buildFilePath = (file: FileWithUrl[]) => {
      const fileMap = new Map<Id<"files">, FileWithUrl>();
      files.forEach((f) => fileMap.set(f._id, f));

      const getFullFilePath = (file: FileWithUrl): string => {
        if (!file.parentId) {
          return file.name;
        }
        const parent = fileMap.get(file.parentId);

        if (!parent) {
          return file.name;
        }
        return `${getFullFilePath(parent)}/${file.name}`;
      };

      const paths: Record<string, FileWithUrl> = {};
      files.forEach((file) => {
        paths[getFullFilePath(file)] = file;
      });
      return paths;
    };
    const filePaths = buildFilePath(files);
    const fileEntries = Object.entries(filePaths).filter(
      ([, file]) => file.type === "file",
    );

    if (fileEntries.length === 0) {
      throw new NonRetriableError("No files to export");
    }

    const treeItem = await step.run("create-blobs", async () => {
      const items: {
        path: string;
        mode: "100644";
        type: "blob";
        sha: string;
      }[] = [];

      for (const [path, file] of fileEntries) {
        let content: string;
        let encoding: "base64" | "utf-8" = "utf-8";
        if (file.content !== undefined) {
          content = file.content;
        } else if (file.storageUrl) {
          const response = await fetch(file.storageUrl);

          const buffer = Buffer.from(await response.arrayBuffer());
          content = buffer.toString("base64");
          encoding = "base64";
        } else {
          continue;
        }
        const { data: blob } = await octokit.rest.git.createBlob({
          owner: user.login,
          repo: repoName,
          content,
          encoding,
        });
        items.push({
          path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });

        return items;
      }
    });
    if (treeItem?.length === 0 || treeItem === null) {
      throw new NonRetriableError("Failed to create any file blobs");
    }

    const { data: tree } = await step.run("create-tree", async () => {
      return await octokit.rest.git.createTree({
        owner: user.login,
        repo: repoName,
        tree: treeItem,
      });
    });
    const { data: commit } = await step.run("create-commit", async () => {
      return await octokit.rest.git.createCommit({
        owner: user.login,
        repo: repoName,
        message: "Initial commit",
        tree: tree.sha,
        parents: [initialCommitSha],
      });
    });
    await step.run("update-branch-ref", async () => {
      return await octokit.rest.git.updateRef({
        owner: user.login,
        repo: repoName,
        ref: "heads/main",
        sha: commit.sha,
      });
    });
    return {
      success: true,
      repoUrl: repo.html_url,
      filesExported: treeItem?.length,
    };
  },
);

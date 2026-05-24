import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { Octokit } from "octokit";
import { isBinaryFile } from "isbinaryfile";

interface ImportGithubRepoEvent {
  owner: string;
  repo: string;
  projectId: Id<"projects">;
  githubToken: string;
}
export const importToGitHub = inngest.createFunction(
  {
    id: "import-to-github",
    onFailure: async ({ event, step }) => {
      const internalKey = process.env.CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ImportGithubRepoEvent;
      await step.run("update-project-on-failure", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId,
          importStatus: "failed",
        });
      });
    },
    triggers: [{ event: "github/import.repo" }],
  },
  async ({ event, step }) => {
    const { owner, repo, projectId, githubToken } =
      event.data as ImportGithubRepoEvent;
    const internalKey = process.env.CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new Error("Internal key not configured");
    }
    const octokit = new Octokit({ auth: githubToken });
    await step.run("cleanup", async () => {
      await convex.mutation(api.system.cleanup, {
        internalKey,
        projectId,
      });
    });

    const tree = await step.run("get-repo-tree", async () => {
      try {
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: "main",
          recursive: "1",
        });

        return data;
      } catch {
        // Fallback to master branch
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: "master",
          recursive: "1",
        });

        return data;
      }
    });

    const folders = tree.tree
      .filter((item) => item.type === "tree" && item.path)
      .sort((a, b) => {
        const aDepth = a.path ? a.path.split("/").length : 0;
        const bDepth = b.path ? b.path.split("/").length : 0;

        return aDepth - bDepth;
      });

    const folderIdMap = await step.run("create-folders", async () => {
      const map: Record<string, Id<"files">> = {};

      for (const folder of folders) {
        if (!folder.path) continue;
        const pathParts = folder.path.split("/");
        const name = pathParts?.pop();
        const parentPath = pathParts.join("/");
        const parentId = parentPath ? map[parentPath] : undefined;

        const folderId = await convex.mutation(api.system.createFolder, {
          internalKey,
          name: name ?? "root",
          projectId,
          parentId,
        });
        map[folder.path] = folderId;
      }

      return map;
    });

    const allFiles = tree.tree.filter(
      (item) => item.type === "blob" && item.path && item.sha,
    );
    await step.run("create-files", async () => {
      for (const file of allFiles) {
        if (!file.path || !file.sha) continue;

        try {
          const { data: blob } = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: file.sha,
          });
          const buffer = Buffer.from(blob.content, "base64");
          const isBinary = await isBinaryFile(buffer);

          const pathParts = file.path.split("/");
          const name = pathParts?.pop();
          const parentPath = pathParts.join("/");
          const parentId = parentPath ? folderIdMap[parentPath] : undefined;
          if (isBinary) {
            const uploadedUrl = await convex.mutation(
              api.system.generateUploadUrl,
              { internalKey },
            );
            const storageApiCall = await fetch(uploadedUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
              },
              body: buffer,
            });

            const { storageId } = await storageApiCall.json();
            await convex.mutation(api.system.createBinaryFile, {
              internalKey,
              projectId,
              name: name ?? "",
              storageId,
              parentId,
            });
          } else {
            if (!name) continue;
            const content = buffer.toString("utf-8");
            await convex.mutation(api.system.createFile, {
              internalKey,
              projectId,
              name,
              content,
              parentId,
            });
          }
        } catch (error) {
          console.error(`Failed to import file: ${file.path}`);
        }
      }
      await step.run("set-completed-status", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId,
          importStatus: "completed",
        });
      });

      return { success: true, projectId };
    });
  },
);

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
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
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
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
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
        auto_init: true,
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
  },
);

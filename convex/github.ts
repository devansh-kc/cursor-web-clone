import { mutation } from "./_generated/server";
import { v as convexServerValues } from "convex/values";
import { verifyAuth } from "./auth";
import { Octokit, App } from "octokit";

export const exportToGithub = mutation({
  args: {
    projectId: convexServerValues.id("projects"),
    repoName: convexServerValues.string(),
    repoDescription: convexServerValues.optional(convexServerValues.string()),
    isPrivate: convexServerValues.boolean(),
  },
  handler: async (convexToJson, args) => {
    const identity = await verifyAuth(convexToJson);

    const octokit = new Octokit({ auth: identity?.subject });
  },
});

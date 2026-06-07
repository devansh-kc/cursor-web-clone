import { v as convexServerValues } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const updateSettings = mutation({
  args: {
    id: convexServerValues.id("projects"),
    settings: convexServerValues.optional(
      convexServerValues.object({
        installCommand: convexServerValues.optional(
          convexServerValues.string(),
        ),
        devCommand: convexServerValues.optional(convexServerValues.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.ownerId !== identity?.subject) {
      throw new Error("Unauthorized to access this project");
    }

    await ctx.db.patch("projects", args.id, {
      settings: args.settings,
      updatedAt: Date.now(),
    });
  },
});
export const create = mutation({
  args: {
    name: convexServerValues.string(),
  },
  handler: async (ctx, argumentParameter) => {
    const identity = await verifyAuth(ctx);
    await ctx.db.insert("projects", {
      name: argumentParameter.name,
      ownerId: identity?.subject,
      updatedAt: Date.now(),
    });
  },
});

export const getPartial = query({
  args: {
    limit: convexServerValues.number(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (userData) =>
        userData.eq("ownerId", identity.subject),
      )
      .order("desc")
      .take(args.limit);
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (userData) =>
        userData.eq("ownerId", identity.subject),
      )
      .collect();
  },
});

export const getProjectById = query({
  args: {
    id: convexServerValues.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return null;
    }
    const projectById = await ctx.db.get("projects", args.id);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }
    return projectById;
  },
});
export const renameProjectById = mutation({
  args: {
    id: convexServerValues.id("projects"),
    name: convexServerValues.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const projectById = await ctx.db.get("projects", args.id);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }
    await ctx.db.patch("projects", args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: convexServerValues.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get("projects", args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to delete this project");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const file of files) {
      await ctx.db.delete("files", file._id);
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const conversation of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .collect();

      for (const message of messages) {
        await ctx.db.delete("messages", message._id);
      }

      await ctx.db.delete("conversations", conversation._id);
    }

    await ctx.db.delete("projects", args.id);
  },
});

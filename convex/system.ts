import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const validateInternalKey = (key: string) => {
  const internalKey = process.env.CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    throw new Error("CONVEX_INTERNAL_KEY is not configured");
  }
  if (key !== internalKey) {
    throw new Error("Invalid internal key");
  }
};
export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
  },

  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.conversationId);
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      conversationId: args.conversationId,
      projectId: args?.projectId,
      role: args.role,
      status: args.status ?? "completed",
    });

    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });
    return messageId;
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      content: args.content,
      status: "completed" as const,
    });
  },
});
export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      status: args.status,
    });
  },
});

export const getProcessingMessages = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  async handler(ctx, args) {
    validateInternalKey(args.internalKey);
    return await ctx.db
      .query("messages")
      .withIndex("by_project_status", (query) =>
        query.eq("projectId", args.projectId).eq("status", "processing"),
      )
      .collect();
  },
});

// used by agent connvo context
export const getRecentMessages = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    validateInternalKey(args.internalKey);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (query) =>
        query.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
    const limit = args.limit ?? 10;

    return messages.slice(-limit);
  },
});

// This will update conversation title
export const updateConversationTitle = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

//  Dont know about list file feature

export const getProjectFiles = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  async handler(ctx, args) {
    validateInternalKey(args.internalKey);
    return await ctx.db
      .query("files")
      .withIndex("by_project", (query) => query.eq("projectId", args.projectId))
      .collect();
  },
});

// get file by ID

export const getFileById = query({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
  },
  async handler(ctx, args) {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.fileId);
  },
});

export const updateFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }
    await ctx.db.patch(args.fileId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

// create file

export const createFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (query) =>
        query.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFile = files.find(
      (file) => file.name === args.name && file.type === "file",
    );
    if (existingFile) {
      throw new Error("File already exists");
    }
    const fileId = await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: args.name,
      type: "file",
      content: args.content,
      updatedAt: Date.now(),
    });
    return fileId;
  },
});

// create folder

export const createBulkFiles = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    files: v.array(
      v.object({
        name: v.string(),
        content: v.string(),
      }),
    ),
  },

  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const existingFiles = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (query) =>
        query.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();
    const results: { name: string; fileId: string; error?: string }[] = [];
    for (const file of args.files) {
      const existingFile = existingFiles?.find(
        (file) => file.name === file.name && file.type === "file",
      );

      if (existingFile) {
        results?.push({
          name: file.name,
          fileId: existingFile._id,
          error: "File already exists",
        });
      }

      const fileId = await ctx.db.insert("files", {
        projectId: args.projectId,
        parentId: args.parentId,
        name: file.name,
        type: "file",
        content: file.content,
        updatedAt: Date.now(),
      });
      results?.push({
        name: file.name,
        fileId: fileId,
      });
    }
    return results;
  },
});

export const createBulkfolders = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    folders: v.array(
      v.object({
        name: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const folders = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (query) =>
        query.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();
    const existingFolders = folders.filter(
      (folder) => folder.name === args?.name && folder.type === "folder",
    );
    const results: { name: string; fileId: string; error?: string }[] = [];
    for (const folder of args.folders) {
      const existingFolder = existingFolders?.find(
        (folder) => folder.name === folder.name && folder.type === "folder",
      );

      if (existingFolder) {
        results?.push({
          name: folder.name,
          fileId: existingFolder._id,
          error: "F already exists",
        });
      }

      const fileId = await ctx.db.insert("files", {
        projectId: args.projectId,
        parentId: args.parentId,
        name: folder.name,
        type: "folder",
        updatedAt: Date.now(),
      });
      results?.push({
        name: folder.name,
        fileId: fileId,
      });
    }
    return results;
  },
});

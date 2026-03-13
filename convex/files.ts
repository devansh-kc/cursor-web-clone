import { v as convexServerValues } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { Id } from "./_generated/dataModel";
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

export const getFiles = query({
  args: {
    projectId: convexServerValues.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }

    const projectById = await ctx.db.get("projects", args.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("files")
      .withIndex("by_project", (userData) =>
        userData.eq("projectId", args.projectId),
      )
      .collect();
  },
});

export const getFileById = query({
  args: {
    id: convexServerValues.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }

    const fileById = await ctx.db.get("files", args.id);
    if (!fileById) {
      throw new Error("File not found");
    }

    const projectById = await ctx.db.get("projects", fileById.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this file");
    }
    return fileById;
  },
});
export const getFolderContents = query({
  args: {
    projectId: convexServerValues.id("projects"),
    parentId: convexServerValues.optional(convexServerValues.id("files")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return null;
    }
    const projectById = await ctx.db.get("projects", args.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (userData) =>
        userData.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();
    return files?.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") {
        return -1;
      }
      if (a.type === "file" && b.type === "folder") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

export const createFile = mutation({
  args: {
    projectId: convexServerValues.id("projects"),
    parentId: convexServerValues.optional(convexServerValues.id("files")),
    name: convexServerValues.string(),
    content: convexServerValues.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const projectById = await ctx.db.get("projects", args.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    // check if file already exists
    const file = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (userData) =>
        userData?.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFile = file.find((file) => file.name === args.name);
    if (existingFile) {
      throw new Error("File already exists");
    }

    return ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: args.name,
      content: args.content,
      type: "file",
      updatedAt: Date.now(),
    });
  },
});

export const createFolder = mutation({
  args: {
    projectId: convexServerValues.id("projects"),
    parentId: convexServerValues.optional(convexServerValues.id("files")),
    name: convexServerValues.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const projectById = await ctx.db.get("projects", args.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    // check if file already exists
    const folder = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (userData) =>
        userData?.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFolder = folder.find((folder) => folder.name === args.name);
    if (existingFolder) {
      throw new Error("Folder already exists");
    }

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: args.name,
      type: "folder",
      updatedAt: Date.now(),
    });
  },
});

export const renameFile = mutation({
  args: {
    id: convexServerValues.id("files"),
    newName: convexServerValues.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const fileById = await ctx.db.get("files", args.id);
    if (!fileById) {
      throw new Error("File not found");
    }
    const projectById = await ctx.db.get("projects", fileById.projectId);
    if (projectById?.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this file");
    }
    // if the file already exists with the same name
    const siblingFile = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (userData) =>
        userData
          .eq("projectId", fileById.projectId)
          .eq("parentId", fileById.parentId),
      )
      .collect();

    const exitsingSiblingFileOrFolder = siblingFile.find(
      (siblingFile) =>
        siblingFile.name === args.newName &&
        siblingFile.type === fileById.type &&
        siblingFile._id !== args.id,
    );
    if (exitsingSiblingFileOrFolder) {
      throw new Error(
        `A ${fileById.type} with this name already exists in this location`,
      );
    }
    const now = Date.now();

    // Update the file's name
    await ctx.db.patch("files", args.id, {
      name: args.newName,
      updatedAt: now,
    });

    await ctx.db.patch("projects", fileById.projectId, {
      updatedAt: now,
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: convexServerValues.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const fileById = await ctx.db.get("files", args.fileId);
    if (!fileById) {
      throw new Error("File not found");
    }
    const projectById = await ctx.db.get("projects", fileById.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById?.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this file");
    }
    const deleteRecursive = async (fileId: Id<"files">) => {
      const item = await ctx.db.get("files", fileId);

      if (!item) {
        return;
      }

      if (fileById.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (userData) =>
            userData
              .eq("projectId", fileById.projectId)
              .eq("parentId", args.fileId),
          )
          .collect();
        for (const child of children) {
          await deleteRecursive(child._id);
        }
        // Delete storage file if it exists
        if (fileById.storageId) {
          await ctx.storage.delete(fileById.storageId);
        }

        // Delete the file/folder itself
      }
      await ctx.db.delete("files", args.fileId);
    };
    await deleteRecursive(args.fileId);

    await ctx.db.patch("projects", fileById.projectId, {
      updatedAt: Date.now(),
    });
  },
});
export const updateFile = mutation({
  args: {
    id: convexServerValues.id("files"),
    content: convexServerValues.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }
    const fileById = await ctx.db.get("files", args.id);
    if (!fileById) {
      throw new Error("File not found");
    }
    const projectById = await ctx.db.get("projects", fileById.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById?.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this file");
    }

    await ctx.db.patch("files", args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", fileById?.projectId, {
      updatedAt: Date.now(),
    });
  },
});

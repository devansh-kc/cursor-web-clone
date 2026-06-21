import { v as convexServerValues } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
/**
 * Creates a new project.
 *
 * @mutation
 * @param {string} args.name - The name of the project to create.
 * @returns {Promise<void>}
 * @throws {Error} If the user is not authenticated.
 */
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

/**
 * Retrieves all files belonging to a specific project.
 *
 * @query
 * @param {Id<"projects">} args.projectId - The ID of the project to fetch files from.
 * @returns {Promise<Array>} An array of file documents, or an empty array if unauthenticated.
 * @throws {Error} If the project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
export const getFiles = query({
  args: {
    projectId: convexServerValues.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return [];
    }

    const projects = await ctx.db.get("projects", args.projectId);
    if (!projects) {
      throw new Error("File not found");
    }
    if (projects.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }
    return await ctx.db
      .query("files")
      .withIndex("by_project", (userData) =>
        userData.eq("projectId", args?.projectId ?? ""),
      )
      .collect();
  },
});

/**
 * Retrieves a single file by its ID.
 *
 * @query
 * @param {Id<"files">} args.id - The ID of the file to retrieve.
 * @returns {Promise<Object | Array>} The file document, or an empty array if unauthenticated.
 * @throws {Error} If the file is not found.
 * @throws {Error} If the parent project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
export const getFileById = query({
  args: {
    id: convexServerValues.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return undefined;
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
/**
 * Retrieves the contents of a folder within a project.
 *
 * Results are sorted with folders first, then files, both in alphabetical order.
 *
 * @query
 * @param {Id<"projects">} args.projectId - The ID of the project.
 * @param {Id<"files">} [args.parentId] - The ID of the parent folder. If omitted, returns root-level contents.
 * @returns {Promise<Array | null>} A sorted array of file/folder documents, or `null` if unauthenticated.
 * @throws {Error} If the project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
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

/**
 * Creates a new file within a project.
 *
 * Checks for duplicate file names within the same parent folder before inserting.
 *
 * @mutation
 * @param {Id<"projects">} args.projectId - The ID of the project to create the file in.
 * @param {Id<"files">} [args.parentId] - The ID of the parent folder. If omitted, file is created at root level.
 * @param {string} args.name - The name of the file.
 * @param {string} args.content - The initial content of the file.
 * @returns {Promise<Id<"files"> | Array>} The ID of the newly created file, or an empty array if unauthenticated.
 * @throws {Error} If the project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 * @throws {Error} If a file with the same name already exists in the target location.
 */
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

/**
 * Creates a new folder within a project.
 *
 * Checks for duplicate folder names within the same parent folder before inserting.
 * Also updates the parent project's `updatedAt` timestamp.
 *
 * @mutation
 * @param {Id<"projects">} args.projectId - The ID of the project to create the folder in.
 * @param {Id<"files">} [args.parentId] - The ID of the parent folder. If omitted, folder is created at root level.
 * @param {string} args.name - The name of the folder.
 * @returns {Promise<Id<"files"> | Array>} The ID of the newly created folder, or an empty array if unauthenticated.
 * @throws {Error} If the project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 * @throws {Error} If a folder with the same name already exists in the target location.
 */
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

/**
 * Renames an existing file or folder.
 *
 * Validates that no sibling file/folder of the same type already has the new name.
 * Updates both the file's and the parent project's `updatedAt` timestamps.
 *
 * @mutation
 * @param {Id<"files">} args.id - The ID of the file or folder to rename.
 * @param {string} args.newName - The new name for the file or folder.
 * @returns {Promise<void | Array>} Resolves when renamed, or returns an empty array if unauthenticated.
 * @throws {Error} If the file is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 * @throws {Error} If a sibling of the same type with the new name already exists.
 */
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

/**
 * Deletes a file or folder, including all nested children recursively.
 *
 * For folders, all descendant files and folders are deleted first.
 * If any file has an associated storage object, it is also deleted.
 * Updates the parent project's `updatedAt` timestamp after deletion.
 *
 * @mutation
 * @param {Id<"files">} args.fileId - The ID of the file or folder to delete.
 * @returns {Promise<void | Array>} Resolves when deleted, or returns an empty array if unauthenticated.
 * @throws {Error} If the file is not found.
 * @throws {Error} If the parent project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
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
/**
 * Updates the content of an existing file.
 *
 * Updates both the file's and the parent project's `updatedAt` timestamps.
 *
 * @mutation
 * @param {Id<"files">} args.id - The ID of the file to update.
 * @param {string} args.content - The new content for the file.
 * @returns {Promise<void | Array>} Resolves when updated, or returns an empty array if unauthenticated.
 * @throws {Error} If the file is not found.
 * @throws {Error} If the parent project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
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
/**
 * Retrieves the sibling files and folders of a given file, sorted with folders first then files alphabetically.
 *
 * Looks up the file's parent folder and returns all items at that same level within the project.
 *
 * @query
 * @param {Id<"files">} args.fileId - The ID of the file whose siblings to retrieve.
 * @returns {Promise<Array | null>} A sorted array of sibling file/folder documents, or `null` if unauthenticated.
 * @throws {Error} If the file is not found.
 * @throws {Error} If the parent project is not found.
 * @throws {Error} If the authenticated user is not the project owner.
 */
export const getFilePath = query({
  args: {
    fileId: convexServerValues.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (!identity) {
      return undefined;
    }
    const fileById = await ctx.db.get("files", args.fileId);
    if (!fileById) {
      throw new Error("File not found");
    }
    const projectById = await ctx.db.get("projects", fileById.projectId);
    if (!projectById) {
      throw new Error("Project not found");
    }
    if (projectById.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }
    const path: { _id: string; name: string }[] = [];
    let currentId: Id<"files"> | undefined = args.fileId;
    while (currentId) {
      const files = (await ctx.db.get("files", currentId)) as
        | Doc<"files">
        | undefined;

      if (!files) break;

      path.unshift({
        _id: files._id,
        name: files.name,
      });
      currentId = files.parentId;
    }
    return path;
  },
});

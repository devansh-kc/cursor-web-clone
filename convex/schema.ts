import { defineSchema, defineTable } from "convex/server";
import { v as convexServerValues } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: convexServerValues.string(),
    ownerId: convexServerValues.string(),
    updatedAt: convexServerValues.number(),
    importStatus: convexServerValues.optional(
      convexServerValues.union(
        convexServerValues.literal("importing"),
        convexServerValues.literal("completed"),
        convexServerValues.literal("failed"),
      ),
    ),
    exportStatus: convexServerValues.optional(
      convexServerValues.union(
        convexServerValues.literal("exporting"),
        convexServerValues.literal("completed"),
        convexServerValues.literal("failed"),
        convexServerValues.literal("cancelled"),
      ),
    ),
    exportRepoUrl: convexServerValues.optional(convexServerValues.string()),
  }).index("by_owner", ["ownerId"]),

  files: defineTable({
    projectId: convexServerValues.id("projects"),
    parentId: convexServerValues.optional(convexServerValues.id("files")),
    name: convexServerValues.string(),
    type: convexServerValues.union(
      convexServerValues.literal("file"),
      convexServerValues.literal("folder"),
    ),
    content: convexServerValues.optional(convexServerValues.string()), // Text files only
    storageId: convexServerValues.optional(convexServerValues.id("_storage")),
    updatedAt: convexServerValues?.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),
});

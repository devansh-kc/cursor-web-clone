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
});

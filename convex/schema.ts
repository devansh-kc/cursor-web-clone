import { defineSchema, defineTable } from "convex/server";
import { v as convexServerValues } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: convexServerValues.string(),
    ownerId: convexServerValues.string(),
    importStatus: convexServerValues.optional(
      convexServerValues.union(
        convexServerValues.literal("importing"),
        convexServerValues.literal("completed"),
        convexServerValues.literal("failed"),
      ),
    ),
  }).index("by_owner", ["ownerId"]),
});

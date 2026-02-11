import { v as convexServerValues } from "convex/values";
import { mutation, query } from "./_generated/server";
export const create = mutation({
  args: {
    name: convexServerValues.string(),
  },
  handler: async (ctx, argumentParameter) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("unauthorized");
    }

    await ctx.db.insert("projects", {
      name: argumentParameter.name,
      ownerId: identity?.subject,
    });
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (userData) =>
        userData.eq("ownerId", identity.subject),
      )
      .collect();
    return projects;
  },
});

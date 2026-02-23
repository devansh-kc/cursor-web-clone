import { v as convexServerValues } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
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

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    senderId: v.id("users"),
    recipientId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Message cannot be empty.");
    if (args.senderId === args.recipientId) {
      throw new Error("You cannot message yourself.");
    }

    const recipient = await ctx.db.get(args.recipientId);
    if (!recipient || recipient.isPublic === false || recipient.allowMessages === false) {
      throw new Error("This user does not accept messages.");
    }

    return await ctx.db.insert("messages", {
      senderId: args.senderId,
      recipientId: args.recipientId,
      body: body.slice(0, 600),
      createdAt: Date.now(),
    });
  },
});

export const inbox = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.userId))
      .order("desc")
      .take(30);

    return await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender
            ? { _id: sender._id, name: sender.name, username: sender.username }
            : null,
        };
      })
    );
  },
});

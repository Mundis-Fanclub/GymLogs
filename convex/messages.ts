import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const MAX_MESSAGE_LENGTH = 600;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 8;

function orderedPair(a: Id<"users">, b: Id<"users">) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

function preview(body: string) {
  return body.length > 90 ? `${body.slice(0, 87)}...` : body;
}

async function userPreview(ctx: QueryCtx, user: Doc<"users"> | null) {
  if (!user) return null;
  const avatarStorageUrl = user.avatarStorageId
    ? await ctx.storage.getUrl(user.avatarStorageId)
    : null;
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: avatarStorageUrl ?? user.avatarUrl,
    profileAccent: user.profileAccent ?? "emerald",
    isPro: user.isPro ?? false,
    allowMessages: user.allowMessages ?? true,
  };
}

async function isBlocked(
  ctx: QueryCtx | MutationCtx,
  blockerId: Id<"users">,
  blockedId: Id<"users">
) {
  return await ctx.db
    .query("message_blocks")
    .withIndex("by_blocker_and_blocked", (q) =>
      q.eq("blockerId", blockerId).eq("blockedId", blockedId)
    )
    .unique();
}

export const send = mutation({
  args: {
    senderId: v.id("users"),
    recipientId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim().replace(/\s+/g, " ");
    if (body.length === 0) throw new Error("Message cannot be empty.");
    if (args.senderId === args.recipientId) {
      throw new Error("You cannot message yourself.");
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message is too long.");
    }

    const [sender, recipient] = await Promise.all([
      ctx.db.get(args.senderId),
      ctx.db.get(args.recipientId),
    ]);
    if (!sender) throw new Error("Sender not found.");
    if (!recipient || recipient.isPublic === false || recipient.allowMessages === false) {
      throw new Error("This user does not accept messages.");
    }

    if (await isBlocked(ctx, args.recipientId, args.senderId)) {
      throw new Error("This user does not accept messages from you.");
    }
    if (await isBlocked(ctx, args.senderId, args.recipientId)) {
      throw new Error("Unblock this user before sending a message.");
    }

    const since = Date.now() - RATE_WINDOW_MS;
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.senderId).gte("createdAt", since))
      .order("desc")
      .take(MAX_MESSAGES_PER_WINDOW + 1);

    if (recentMessages.length >= MAX_MESSAGES_PER_WINDOW) {
      throw new Error("You are sending messages too quickly. Try again in a few minutes.");
    }
    if (recentMessages.slice(0, 3).some((message) => message.body === body)) {
      throw new Error("Duplicate messages are limited to protect people from spam.");
    }
    const linkCount = (body.match(/https?:\/\//g) ?? []).length;
    if (linkCount > 2) {
      throw new Error("Messages can include at most two links.");
    }

    const pair = orderedPair(args.senderId, args.recipientId);
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_pair", (q) => q.eq("userAId", pair.userAId).eq("userBId", pair.userBId))
      .unique();

    const now = Date.now();
    const conversationId =
      existingConversation?._id ??
      (await ctx.db.insert("conversations", {
        ...pair,
        createdAt: now,
        updatedAt: now,
      }));

    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId: args.senderId,
      recipientId: args.recipientId,
      body,
      createdAt: now,
    });

    await ctx.db.patch(conversationId, {
      lastMessagePreview: preview(body),
      lastSenderId: args.senderId,
      updatedAt: now,
    });

    return messageId;
  },
});

export const conversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [asA, asB] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_user_a_and_updated", (q) => q.eq("userAId", args.userId))
        .order("desc")
        .take(25),
      ctx.db
        .query("conversations")
        .withIndex("by_user_b_and_updated", (q) => q.eq("userBId", args.userId))
        .order("desc")
        .take(25),
    ]);

    const conversations = [...asA, ...asB].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);

    return await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.userAId === args.userId ? conversation.userBId : conversation.userAId;
        const [otherUser, block, unreadMessages] = await Promise.all([
          ctx.db.get(otherUserId),
          isBlocked(ctx, args.userId, otherUserId),
          ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversation._id))
            .order("desc")
            .take(50),
        ]);

        const unreadCount = unreadMessages.filter(
          (message) => message.recipientId === args.userId && !message.readAt
        ).length;

        return {
          ...conversation,
          otherUser: await userPreview(ctx, otherUser),
          isBlocked: Boolean(block),
          unreadCount,
        };
      })
    );
  },
});

export const thread = query({
  args: {
    userId: v.id("users"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (conversation.userAId !== args.userId && conversation.userBId !== args.userId) {
      throw new Error("Conversation not found.");
    }

    const otherUserId =
      conversation.userAId === args.userId ? conversation.userBId : conversation.userAId;
    const [otherUser, block] = await Promise.all([
      ctx.db.get(otherUserId),
      isBlocked(ctx, args.userId, otherUserId),
    ]);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(100);

    return {
      conversation,
      otherUser: await userPreview(ctx, otherUser),
      isBlocked: Boolean(block),
      messages: messages.filter((message) =>
        message.senderId === args.userId ? !message.hiddenForSender : !message.hiddenForRecipient
      ),
    };
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

export const markConversationRead = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (conversation.userAId !== args.userId && conversation.userBId !== args.userId) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(100);

    const now = Date.now();
    await Promise.all(
      messages
        .filter((message) => message.recipientId === args.userId && !message.readAt)
        .map((message) => ctx.db.patch(message._id, { readAt: now }))
    );
  },
});

export const blockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.blockerId === args.blockedId) throw new Error("You cannot block yourself.");
    const existing = await isBlocked(ctx, args.blockerId, args.blockedId);
    if (existing) return existing._id;
    return await ctx.db.insert("message_blocks", {
      blockerId: args.blockerId,
      blockedId: args.blockedId,
      reason: args.reason?.trim().slice(0, 160),
      createdAt: Date.now(),
    });
  },
});

export const unblockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await isBlocked(ctx, args.blockerId, args.blockedId);
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const reportMessage = mutation({
  args: {
    reporterId: v.id("users"),
    messageId: v.id("messages"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    if (message.senderId !== args.reporterId && message.recipientId !== args.reporterId) {
      throw new Error("Message not found.");
    }

    const reportedUserId =
      message.senderId === args.reporterId ? message.recipientId : message.senderId;

    const reportId = await ctx.db.insert("message_reports", {
      reporterId: args.reporterId,
      reportedUserId,
      messageId: args.messageId,
      reason: args.reason.trim().slice(0, 80) || "other",
      details: args.details?.trim().slice(0, 500),
      status: "open",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.messageId, {
      reportCount: (message.reportCount ?? 0) + 1,
    });

    return reportId;
  },
});

export const reportUser = mutation({
  args: {
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.reporterId === args.reportedUserId) {
      throw new Error("You cannot report yourself.");
    }
    const reportedUser = await ctx.db.get(args.reportedUserId);
    if (!reportedUser) throw new Error("User not found.");

    return await ctx.db.insert("message_reports", {
      reporterId: args.reporterId,
      reportedUserId: args.reportedUserId,
      reason: args.reason.trim().slice(0, 80) || "profile",
      details: args.details?.trim().slice(0, 500),
      status: "open",
      createdAt: Date.now(),
    });
  },
});

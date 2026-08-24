import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUserMatch } from "./authz";

const MAX_MESSAGE_LENGTH = 600;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 8;
const sharedPostPattern = /Shared a post with you:\s*\/social\?post=([a-z0-9]+)/i;
const messageType = v.union(v.literal("text"), v.literal("post_share"), v.literal("image"));

function orderedPair(a: Id<"users">, b: Id<"users">) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

function preview(body: string) {
  return body.length > 90 ? `${body.slice(0, 87)}...` : body;
}

function messagePreview(args: {
  type?: "text" | "post_share" | "image";
  body: string;
}) {
  if (args.type === "post_share" || sharedPostPattern.test(args.body)) return "Beitrag geteilt";
  if (args.type === "image") return args.body ? `Bild: ${preview(args.body)}` : "Bild gesendet";
  return preview(args.body);
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

async function postPreview(ctx: QueryCtx, postId: Id<"social_posts"> | undefined) {
  if (!postId) return null;
  const post = await ctx.db.get(postId);
  if (!post) return null;
  const author = await ctx.db.get(post.authorId);
  const mediaUrl = post.mediaStorageId ? await ctx.storage.getUrl(post.mediaStorageId) : post.mediaUrl;
  const text = [post.body, post.bodyAfter].filter(Boolean).join(" ").trim();

  return {
    _id: post._id,
    author: author
      ? {
          _id: author._id,
          name: author.name,
          username: author.username,
        }
      : null,
    excerpt: text.length > 140 ? `${text.slice(0, 137)}...` : text,
    mediaUrl: mediaUrl ?? null,
    mediaType: post.mediaType ?? null,
  };
}

function legacyPostId(message: Doc<"messages">) {
  const match = message.body.match(sharedPostPattern);
  return match?.[1] as Id<"social_posts"> | undefined;
}

async function renderMessage(ctx: QueryCtx, message: Doc<"messages">) {
  const derivedPostId = message.postId ?? legacyPostId(message);
  const derivedType = message.type ?? (derivedPostId ? "post_share" : "text");

  return {
    ...message,
    type: derivedType,
    postId: derivedPostId,
    postPreview: await postPreview(ctx, derivedPostId),
    mediaUrl: (message.mediaStorageId ? await ctx.storage.getUrl(message.mediaStorageId) : message.mediaUrl) ?? null,
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
    type: v.optional(messageType),
    postId: v.optional(v.id("social_posts")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.literal("image")),
  },
  handler: async (ctx, args) => {
    const senderId = await requireUserMatch(ctx, args.senderId);
    const type = args.type ?? "text";
    const body = args.body.trim().replace(/\s+/g, " ");
    if (body.length === 0 && type === "text") throw new Error("Message cannot be empty.");
    if (type === "image" && !args.mediaStorageId && !args.mediaUrl) {
      throw new Error("Image messages need an uploaded image.");
    }
    if (type === "post_share" && !args.postId) {
      throw new Error("Shared post messages need a post.");
    }
    if (senderId === args.recipientId) {
      throw new Error("You cannot message yourself.");
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message is too long.");
    }

    const [sender, recipient] = await Promise.all([
      ctx.db.get(senderId),
      ctx.db.get(args.recipientId),
    ]);
    if (!sender) throw new Error("Sender not found.");
    if (!recipient || recipient.isPublic === false || recipient.allowMessages === false) {
      throw new Error("This user does not accept messages.");
    }

    if (await isBlocked(ctx, args.recipientId, senderId)) {
      throw new Error("This user does not accept messages from you.");
    }
    if (await isBlocked(ctx, senderId, args.recipientId)) {
      throw new Error("Unblock this user before sending a message.");
    }

    const since = Date.now() - RATE_WINDOW_MS;
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", senderId).gte("createdAt", since))
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

    const pair = orderedPair(senderId, args.recipientId);
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

    const message = {
      conversationId,
      senderId,
      recipientId: args.recipientId,
      body,
      type,
      createdAt: now,
      ...(args.postId ? { postId: args.postId } : {}),
      ...(args.mediaStorageId ? { mediaStorageId: args.mediaStorageId } : {}),
      ...(args.mediaUrl ? { mediaUrl: args.mediaUrl } : {}),
      ...(args.mediaStorageId || args.mediaUrl || args.mediaType ? { mediaType: "image" as const } : {}),
    };

    const messageId = await ctx.db.insert("messages", message);

    await ctx.db.patch(conversationId, {
      lastMessagePreview: messagePreview({ type, body }),
      lastSenderId: senderId,
      updatedAt: now,
    });

    return messageId;
  },
});

export const conversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    const [asA, asB] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_user_a_and_updated", (q) => q.eq("userAId", userId))
        .order("desc")
        .take(25),
      ctx.db
        .query("conversations")
        .withIndex("by_user_b_and_updated", (q) => q.eq("userBId", userId))
        .order("desc")
        .take(25),
    ]);

    const conversations = [...asA, ...asB].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);

    return await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.userAId === userId ? conversation.userBId : conversation.userAId;
        const [otherUser, block, unreadMessages] = await Promise.all([
          ctx.db.get(otherUserId),
          isBlocked(ctx, userId, otherUserId),
          ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversation._id))
            .order("desc")
            .take(50),
        ]);

        const unreadCount = unreadMessages.filter(
          (message) => message.recipientId === userId && !message.readAt
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
    const userId = await requireUserMatch(ctx, args.userId);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new Error("Conversation not found.");
    }

    const otherUserId =
      conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    const [otherUser, block] = await Promise.all([
      ctx.db.get(otherUserId),
      isBlocked(ctx, userId, otherUserId),
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
      messages: await Promise.all(
        messages
          .filter((message) =>
            message.senderId === userId ? !message.hiddenForSender : !message.hiddenForRecipient
          )
          .map((message) => renderMessage(ctx, message))
      ),
    };
  },
});

export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const inbox = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
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
    const userId = await requireUserMatch(ctx, args.userId);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;
    if (conversation.userAId !== userId && conversation.userBId !== userId) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(100);

    const now = Date.now();
    await Promise.all(
      messages
        .filter((message) => message.recipientId === userId && !message.readAt)
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
    const blockerId = await requireUserMatch(ctx, args.blockerId);
    if (blockerId === args.blockedId) throw new Error("You cannot block yourself.");
    const existing = await isBlocked(ctx, blockerId, args.blockedId);
    if (existing) return existing._id;
    return await ctx.db.insert("message_blocks", {
      blockerId,
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
    const blockerId = await requireUserMatch(ctx, args.blockerId);
    const existing = await isBlocked(ctx, blockerId, args.blockedId);
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
    const reporterId = await requireUserMatch(ctx, args.reporterId);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found.");
    if (message.senderId !== reporterId && message.recipientId !== reporterId) {
      throw new Error("Message not found.");
    }

    const reportedUserId =
      message.senderId === reporterId ? message.recipientId : message.senderId;

    const reportId = await ctx.db.insert("message_reports", {
      reporterId,
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
    const reporterId = await requireUserMatch(ctx, args.reporterId);
    if (reporterId === args.reportedUserId) {
      throw new Error("You cannot report yourself.");
    }
    const reportedUser = await ctx.db.get(args.reportedUserId);
    if (!reportedUser) throw new Error("User not found.");

    return await ctx.db.insert("message_reports", {
      reporterId,
      reportedUserId: args.reportedUserId,
      reason: args.reason.trim().slice(0, 80) || "profile",
      details: args.details?.trim().slice(0, 500),
      status: "open",
      createdAt: Date.now(),
    });
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const mediaType = v.union(v.literal("image"), v.literal("video"));

async function userPreview(ctx: QueryCtx, user: Doc<"users"> | null) {
  if (!user) return null;
  const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: avatarUrl ?? user.avatarUrl,
    isPro: user.isPro ?? false,
  };
}

async function mediaUrl(ctx: QueryCtx, post: Doc<"social_posts">) {
  if (post.mediaStorageId) return await ctx.storage.getUrl(post.mediaStorageId);
  return post.mediaUrl;
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function orderedPair(a: Id<"users">, b: Id<"users">) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export const generateUploadUrl = mutation({
  args: {
    userId: v.id("users"),
    mediaType,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    body: v.string(),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(mediaType),
    linkedSubmissionId: v.optional(v.id("log_submissions")),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body && !args.mediaStorageId && !args.mediaUrl && !args.linkedSubmissionId) {
      throw new Error("Post needs text, media, or a top log.");
    }
    if (body.length > 1200) throw new Error("Post text is too long.");

    return await ctx.db.insert("social_posts", {
      authorId: args.authorId,
      body,
      mediaStorageId: args.mediaStorageId,
      mediaUrl: args.mediaUrl?.trim().slice(0, 500),
      mediaType: args.mediaType,
      linkedSubmissionId: args.linkedSubmissionId,
      createdAt: Date.now(),
    });
  },
});

export const listFeed = query({
  args: {
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("social_posts")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 30);

    return await Promise.all(
      posts.map(async (post) => {
        const [author, likes, comments, viewerLike, linkedSubmission] = await Promise.all([
          ctx.db.get(post.authorId),
          ctx.db
            .query("social_likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .take(200),
          ctx.db
            .query("social_comments")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .order("asc")
            .take(6),
          args.viewerId
            ? ctx.db
                .query("social_likes")
                .withIndex("by_post_and_user", (q) =>
                  q.eq("postId", post._id).eq("userId", args.viewerId!)
                )
                .unique()
            : null,
          post.linkedSubmissionId ? ctx.db.get(post.linkedSubmissionId) : null,
        ]);

        const renderedComments = await Promise.all(
          comments.map(async (comment) => ({
            ...comment,
            author: await userPreview(ctx, await ctx.db.get(comment.authorId)),
          }))
        );

        let linkedExerciseName = null as string | null;
        if (linkedSubmission) {
          const exercise = await ctx.db.get(linkedSubmission.exerciseId);
          linkedExerciseName = exercise?.name ?? linkedSubmission.liftType;
        }

        return {
          ...post,
          mediaUrl: await mediaUrl(ctx, post),
          author: await userPreview(ctx, author),
          likedByViewer: Boolean(viewerLike),
          likeCount: likes.length,
          commentCount: renderedComments.length,
          comments: renderedComments,
          linkedLog: linkedSubmission
            ? {
                exerciseName: linkedExerciseName,
                liftType: linkedSubmission.liftType,
                weightKg: linkedSubmission.weightKg,
                reps: linkedSubmission.reps,
                score: linkedSubmission.score,
                status: linkedSubmission.status,
              }
            : null,
        };
      })
    );
  },
});

export const toggleLike = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("social_likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("social_likes", {
      postId: args.postId,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const addComment = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Comment cannot be empty.");
    if (body.length > 500) throw new Error("Comment is too long.");
    return await ctx.db.insert("social_comments", {
      postId: args.postId,
      authorId: args.userId,
      body,
      createdAt: Date.now(),
    });
  },
});

export const shareToUsername = mutation({
  args: {
    senderId: v.id("users"),
    postId: v.id("social_posts"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const username = normalizeUsername(args.username);
    const recipient = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    const post = await ctx.db.get(args.postId);
    if (!recipient) throw new Error("User not found.");
    if (!post) throw new Error("Post not found.");
    if (recipient._id === args.senderId) throw new Error("You cannot send this to yourself.");

    const body = `Shared a post with you: /social?post=${post._id}`;
    const pair = orderedPair(args.senderId, recipient._id);
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
      recipientId: recipient._id,
      body,
      createdAt: now,
    });
    await ctx.db.patch(conversationId, {
      lastMessagePreview: "Shared a post",
      lastSenderId: args.senderId,
      updatedAt: now,
    });
    return messageId;
  },
});

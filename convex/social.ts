import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const mediaType = v.union(v.literal("image"), v.literal("video"), v.literal("gif"));
const mediaSize = v.union(v.literal("sm"), v.literal("md"), v.literal("lg"));
const commentMediaType = v.union(v.literal("gif"));

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

async function storyMediaUrl(ctx: QueryCtx, story: Doc<"social_stories">) {
  if (story.mediaStorageId) return await ctx.storage.getUrl(story.mediaStorageId);
  return story.mediaUrl;
}

async function commentMediaUrl(ctx: QueryCtx, comment: Doc<"social_comments">) {
  if (comment.mediaStorageId) return await ctx.storage.getUrl(comment.mediaStorageId);
  return comment.mediaUrl;
}

async function postCounts(ctx: QueryCtx, postId: Id<"social_posts">) {
  const [likes, comments, reposts] = await Promise.all([
    ctx.db
      .query("social_likes")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(500),
    ctx.db
      .query("social_comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(500),
    ctx.db
      .query("social_posts")
      .withIndex("by_repost", (q) => q.eq("repostOfPostId", postId))
      .take(500),
  ]);

  return {
    likeCount: likes.length,
    commentCount: comments.length,
    repostCount: reposts.length,
  };
}

async function linkedLogPreview(ctx: QueryCtx, post: Doc<"social_posts">) {
  if (!post.linkedSubmissionId) return null;
  const linkedSubmission = await ctx.db.get(post.linkedSubmissionId);
  if (!linkedSubmission) return null;
  const exercise = await ctx.db.get(linkedSubmission.exerciseId);

  return {
    exerciseName: exercise?.name ?? linkedSubmission.liftType,
    liftType: linkedSubmission.liftType,
    weightKg: linkedSubmission.weightKg,
    reps: linkedSubmission.reps,
    score: linkedSubmission.score,
    status: linkedSubmission.status,
  };
}

async function viewerRepost(ctx: QueryCtx, postId: Id<"social_posts">, viewerId: Id<"users"> | undefined) {
  if (!viewerId) return null;
  const reposts = await ctx.db
    .query("social_posts")
    .withIndex("by_repost", (q) => q.eq("repostOfPostId", postId))
    .take(500);
  return reposts.find((post) => post.authorId === viewerId) ?? null;
}

async function renderPostSummary(ctx: QueryCtx, post: Doc<"social_posts">, viewerId: Id<"users"> | undefined) {
  const [author, viewerLike, viewerSave, viewerRepostPost, counts, repostOf] = await Promise.all([
    ctx.db.get(post.authorId),
    viewerId
      ? ctx.db
          .query("social_likes")
          .withIndex("by_post_and_user", (q) =>
            q.eq("postId", post._id).eq("userId", viewerId)
          )
          .unique()
      : null,
    viewerId
      ? ctx.db
          .query("social_saves")
          .withIndex("by_post_and_user", (q) =>
            q.eq("postId", post._id).eq("userId", viewerId)
          )
          .unique()
      : null,
    viewerRepost(ctx, post._id, viewerId),
    postCounts(ctx, post._id),
    post.repostOfPostId ? ctx.db.get(post.repostOfPostId) : null,
  ]);

  return {
    ...post,
    mediaUrl: await mediaUrl(ctx, post),
    author: await userPreview(ctx, author),
    likedByViewer: Boolean(viewerLike),
    savedByViewer: Boolean(viewerSave),
    repostedByViewer: Boolean(viewerRepostPost),
    ...counts,
    repostOf: repostOf
      ? {
          ...repostOf,
          mediaUrl: await mediaUrl(ctx, repostOf),
          author: await userPreview(ctx, await ctx.db.get(repostOf.authorId)),
          linkedLog: await linkedLogPreview(ctx, repostOf),
        }
      : null,
    linkedLog: await linkedLogPreview(ctx, post),
  };
}

async function renderComment(
  ctx: QueryCtx,
  comment: Doc<"social_comments">,
  viewerId: Id<"users"> | undefined,
  replyLimit: number
) {
  const [author, likes, viewerLike, replies] = await Promise.all([
    ctx.db.get(comment.authorId),
    ctx.db
      .query("social_comment_likes")
      .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
      .take(200),
    viewerId
      ? ctx.db
          .query("social_comment_likes")
          .withIndex("by_comment_and_user", (q) =>
            q.eq("commentId", comment._id).eq("userId", viewerId)
          )
          .unique()
      : null,
    ctx.db
      .query("social_comments")
      .withIndex("by_post_and_parent_comment", (q) =>
        q.eq("postId", comment.postId).eq("parentCommentId", comment._id)
      )
      .order("asc")
      .take(replyLimit),
  ]);

  const renderedReplies = await Promise.all(
    replies.map(async (reply) => {
      const [replyAuthor, replyLikes, replyViewerLike] = await Promise.all([
        ctx.db.get(reply.authorId),
        ctx.db
          .query("social_comment_likes")
          .withIndex("by_comment", (q) => q.eq("commentId", reply._id))
          .take(200),
        viewerId
          ? ctx.db
              .query("social_comment_likes")
              .withIndex("by_comment_and_user", (q) =>
                q.eq("commentId", reply._id).eq("userId", viewerId)
              )
              .unique()
          : null,
      ]);

      return {
        ...reply,
        author: await userPreview(ctx, replyAuthor),
        mediaUrl: await commentMediaUrl(ctx, reply),
        likeCount: replyLikes.length,
        likedByViewer: Boolean(replyViewerLike),
        replies: [],
      };
    })
  );

  return {
    ...comment,
    author: await userPreview(ctx, author),
    mediaUrl: await commentMediaUrl(ctx, comment),
    likeCount: likes.length,
    likedByViewer: Boolean(viewerLike),
    replies: renderedReplies,
  };
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
    bodyAfter: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(mediaType),
    mediaSize: v.optional(mediaSize),
    mediaScale: v.optional(v.number()),
    linkedSubmissionId: v.optional(v.id("log_submissions")),
    repostOfPostId: v.optional(v.id("social_posts")),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    const bodyAfter = args.bodyAfter?.trim();
    if (
      !body &&
      !bodyAfter &&
      !args.mediaStorageId &&
      !args.mediaUrl &&
      !args.linkedSubmissionId &&
      !args.repostOfPostId
    ) {
      throw new Error("Post needs text, media, or a top log.");
    }
    if (body.length > 1200) throw new Error("Post text is too long.");
    if (args.repostOfPostId) {
      const repostedPost = await ctx.db.get(args.repostOfPostId);
      if (!repostedPost) throw new Error("Post not found.");
      if (repostedPost.authorId === args.authorId) throw new Error("You cannot repost your own post.");
      const existingRepost = await viewerRepost(ctx, args.repostOfPostId, args.authorId);
      if (existingRepost) throw new Error("You already reposted this post.");
    }

    return await ctx.db.insert("social_posts", {
      authorId: args.authorId,
      body,
      bodyAfter,
      mediaStorageId: args.mediaStorageId,
      mediaUrl: args.mediaUrl?.trim().slice(0, 500),
      mediaType: args.mediaType,
      mediaSize: args.mediaSize,
      mediaScale: args.mediaScale ? Math.min(100, Math.max(35, args.mediaScale)) : undefined,
      linkedSubmissionId: args.linkedSubmissionId,
      repostOfPostId: args.repostOfPostId,
      createdAt: Date.now(),
    });
  },
});

export const createStory = mutation({
  args: {
    authorId: v.id("users"),
    body: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(mediaType),
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId);
    if (!author) throw new Error("User not found.");
    const body = args.body?.trim();
    if (!body && !args.mediaStorageId && !args.mediaUrl) {
      throw new Error("Story needs text or media.");
    }
    if (body && body.length > 280) throw new Error("Story text is too long.");
    const now = Date.now();
    return await ctx.db.insert("social_stories", {
      authorId: args.authorId,
      body,
      mediaStorageId: args.mediaStorageId,
      mediaUrl: args.mediaUrl?.trim().slice(0, 500),
      mediaType: args.mediaType,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
  },
});

export const listStories = query({
  args: {
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("social_stories")
      .withIndex("by_expires_at", (q) => q.gt("expiresAt", now))
      .order("asc")
      .take(args.limit ?? 40);

    const rendered = await Promise.all(
      rows.map(async (story) => ({
        ...story,
        mediaUrl: await storyMediaUrl(ctx, story),
        author: await userPreview(ctx, await ctx.db.get(story.authorId)),
        isOwnStory: args.viewerId ? story.authorId === args.viewerId : false,
      }))
    );

    return rendered.sort((a, b) => b.createdAt - a.createdAt);
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

    return await Promise.all(posts.map((post) => renderPostSummary(ctx, post, args.viewerId)));
  },
});

export const listFollowingFeed = query({
  args: {
    viewerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 30, 50);
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.viewerId))
      .order("desc")
      .take(100);

    if (following.length === 0) return [];

    const postsByAuthor = await Promise.all(
      following.map((row) =>
        ctx.db
          .query("social_posts")
          .withIndex("by_author", (q) => q.eq("authorId", row.followingId))
          .order("desc")
          .take(8)
      )
    );

    const posts = postsByAuthor
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return await Promise.all(posts.map((post) => renderPostSummary(ctx, post, args.viewerId)));
  },
});

export const getPostThread = query({
  args: {
    postId: v.id("social_posts"),
    viewerId: v.optional(v.id("users")),
    commentLimit: v.optional(v.number()),
    replyLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const rootComments = await ctx.db
      .query("social_comments")
      .withIndex("by_post_and_parent_comment", (q) =>
        q.eq("postId", args.postId).eq("parentCommentId", undefined)
      )
      .take(args.commentLimit ?? 40);

    const renderedComments = await Promise.all(
      rootComments.map(async (comment) => {
        const rendered = await renderComment(ctx, comment, args.viewerId, args.replyLimit ?? 12);
        const allReplies = await ctx.db
          .query("social_comments")
          .withIndex("by_post_and_parent_comment", (q) =>
            q.eq("postId", comment.postId).eq("parentCommentId", comment._id)
          )
          .take(200);

        return {
          ...rendered,
          replyCount: allReplies.length,
          hiddenReplyCount: Math.max(0, allReplies.length - rendered.replies.length),
          score: rendered.likeCount + allReplies.length * 2,
        };
      })
    );

    renderedComments.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAt - a.createdAt;
    });

    return {
      post: await renderPostSummary(ctx, post, args.viewerId),
      comments: renderedComments,
    };
  },
});

export const listByAuthor = query({
  args: {
    authorId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const author = await ctx.db.get(args.authorId);
    if (!author || author.isPublic === false) return [];

    const posts = await ctx.db
      .query("social_posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(args.limit ?? 30);

    return await Promise.all(posts.map((post) => renderPostSummary(ctx, post, args.viewerId)));
  },
});

export const listSaved = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const saves = await ctx.db
      .query("social_saves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 30);

    const posts = await Promise.all(
      saves.map(async (save) => {
        const post = await ctx.db.get(save.postId);
        return post ? renderPostSummary(ctx, post, args.userId) : null;
      })
    );

    return posts.filter((post) => post !== null);
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

export const toggleSave = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");
    const existing = await ctx.db
      .query("social_saves")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("social_saves", {
      postId: args.postId,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const updatePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
    body: v.string(),
    bodyAfter: v.optional(v.string()),
    mediaSize: v.optional(mediaSize),
    mediaScale: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");
    if (post.authorId !== args.userId) throw new Error("Not allowed.");
    const body = args.body.trim();
    const bodyAfter = args.bodyAfter?.trim();
    if (!body && !bodyAfter && !post.mediaStorageId && !post.mediaUrl && !post.linkedSubmissionId) {
      throw new Error("Post needs text, media, or a top log.");
    }
    if (body.length > 1200) throw new Error("Post text is too long.");
    if ((bodyAfter?.length ?? 0) > 1200) throw new Error("Post text is too long.");
    await ctx.db.patch(args.postId, {
      body,
      bodyAfter,
      mediaSize: args.mediaSize,
      mediaScale: args.mediaScale ? Math.min(100, Math.max(35, args.mediaScale)) : undefined,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const deletePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");
    if (post.authorId !== args.userId) throw new Error("Not allowed.");

    const [postLikes, comments] = await Promise.all([
      ctx.db
        .query("social_likes")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .take(1000),
      ctx.db
        .query("social_comments")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .take(1000),
    ]);

    for (const comment of comments) {
      const commentLikes = await ctx.db
        .query("social_comment_likes")
        .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
        .take(1000);
      for (const like of commentLikes) {
        await ctx.db.delete(like._id);
      }
      await ctx.db.delete(comment._id);
    }

    for (const like of postLikes) {
      await ctx.db.delete(like._id);
    }
    await ctx.db.delete(args.postId);
    return true;
  },
});

export const addComment = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("social_posts"),
    parentCommentId: v.optional(v.id("social_comments")),
    body: v.string(),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(commentMediaType),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length === 0 && !args.mediaStorageId && !args.mediaUrl) {
      throw new Error("Comment cannot be empty.");
    }
    if (body.length > 500) throw new Error("Comment is too long.");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.postId !== args.postId) {
        throw new Error("Parent comment not found.");
      }
    }
    return await ctx.db.insert("social_comments", {
      postId: args.postId,
      parentCommentId: args.parentCommentId,
      authorId: args.userId,
      body,
      mediaStorageId: args.mediaStorageId,
      mediaUrl: args.mediaUrl?.trim().slice(0, 500),
      mediaType: args.mediaType,
      createdAt: Date.now(),
    });
  },
});

export const toggleCommentLike = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("social_comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    const existing = await ctx.db
      .query("social_comment_likes")
      .withIndex("by_comment_and_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("social_comment_likes", {
      commentId: args.commentId,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const updateComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("social_comments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.authorId !== args.userId) throw new Error("Not allowed.");
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Comment cannot be empty.");
    if (body.length > 500) throw new Error("Comment is too long.");
    await ctx.db.patch(args.commentId, {
      body,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const deleteComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("social_comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.authorId !== args.userId) throw new Error("Not allowed.");

    const replies = await ctx.db
      .query("social_comments")
      .withIndex("by_post_and_parent_comment", (q) =>
        q.eq("postId", comment.postId).eq("parentCommentId", comment._id)
      )
      .take(1000);

    for (const reply of replies) {
      const replyLikes = await ctx.db
        .query("social_comment_likes")
        .withIndex("by_comment", (q) => q.eq("commentId", reply._id))
        .take(1000);
      for (const like of replyLikes) {
        await ctx.db.delete(like._id);
      }
      await ctx.db.delete(reply._id);
    }

    const commentLikes = await ctx.db
      .query("social_comment_likes")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .take(1000);
    for (const like of commentLikes) {
      await ctx.db.delete(like._id);
    }

    await ctx.db.delete(args.commentId);
    return true;
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
      type: "post_share",
      postId: post._id,
      createdAt: now,
    });
    await ctx.db.patch(conversationId, {
      lastMessagePreview: "Beitrag geteilt",
      lastSenderId: args.senderId,
      updatedAt: now,
    });
    return messageId;
  },
});

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Heart,
  ImagePlus,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";

type MediaKind = "image" | "video" | "gif";
type MediaSize = "sm" | "md" | "lg";
type CommentMediaDraft = {
  storageId: Id<"_storage">;
  mediaType: "gif";
  previewUrl: string;
};
type SocialFeedTab = "forYou" | "following";

export function SocialPageClient() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();
  const [loadFeed, setLoadFeed] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<Id<"social_posts"> | null>(null);
  const [activeFeedTab, setActiveFeedTab] = useState<SocialFeedTab>("forYou");
  const [shareDialogPostId, setShareDialogPostId] = useState<Id<"social_posts"> | null>(null);
  const forYouPosts = useQuery(
    api.social.listFeed,
    loadFeed && activeFeedTab === "forYou" ? { viewerId: userId, limit: 18 } : "skip"
  );
  const followingPosts = useQuery(
    api.social.listFollowingFeed,
    loadFeed && activeFeedTab === "following" && userId ? { viewerId: userId, limit: 18 } : "skip"
  );
  const stories = useQuery(
    api.social.listStories,
    loadFeed ? { viewerId: userId, limit: 40 } : "skip"
  );
  const currentUser = useQuery(api.users.get, userId ? { userId } : "skip");
  const thread = useQuery(
    api.social.getPostThread,
    selectedPostId ? { postId: selectedPostId, viewerId: userId, commentLimit: 40, replyLimit: 12 } : "skip"
  );

  const createPost = useMutation(api.social.createPost);
  const updatePost = useMutation(api.social.updatePost);
  const deletePost = useMutation(api.social.deletePost);
  const createStory = useMutation(api.social.createStory);
  const markStoryViewed = useMutation(api.social.markStoryViewed);
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const toggleLike = useMutation(api.social.toggleLike);
  const toggleSave = useMutation(api.social.toggleSave);
  const toggleCommentLike = useMutation(api.social.toggleCommentLike);
  const addComment = useMutation(api.social.addComment);
  const updateComment = useMutation(api.social.updateComment);
  const deleteComment = useMutation(api.social.deleteComment);
  const shareToUsername = useMutation(api.social.shareToUsername);
  const friends = useQuery(api.friends.list, userId && shareDialogPostId ? { userId } : "skip");

  const [body, setBody] = useState("");
  const [bodyAfter, setBodyAfter] = useState("");
  const [mediaStorageId, setMediaStorageId] = useState<Id<"_storage"> | undefined>();
  const [mediaType, setMediaType] = useState<MediaKind | undefined>();
  const [mediaSize, setMediaSize] = useState<MediaSize>("lg");
  const [mediaScale, setMediaScale] = useState(100);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [commentMediaDrafts, setCommentMediaDrafts] = useState<Record<string, CommentMediaDraft | undefined>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>({});
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [shareQuery, setShareQuery] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [storyBody, setStoryBody] = useState("");
  const [storyMediaStorageId, setStoryMediaStorageId] = useState<Id<"_storage"> | undefined>();
  const [storyMediaType, setStoryMediaType] = useState<MediaKind | undefined>();
  const [storyPreviewUrl, setStoryPreviewUrl] = useState("");
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostBodies, setEditingPostBodies] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBodies, setEditingCommentBodies] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "post"; id: Id<"social_posts"> }
    | { kind: "comment"; id: Id<"social_comments"> }
    | null
  >(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoadFeed(true), 100);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const posts = activeFeedTab === "forYou" ? forYouPosts : followingPosts;
  const selectedStory = stories?.find((story) => story._id === selectedStoryId) ?? null;
  const feedDescription =
    activeFeedTab === "forYou"
      ? t("socialPage.forYouDescription")
      : t("socialPage.followingDescription");
  const emptyFeedCopy =
    activeFeedTab === "forYou"
      ? t("socialPage.emptyForYou")
      : t("socialPage.emptyFollowing");

  if (isLoaded && !userId) {
    return (
      <EmptyState
        icon={MessageCircle}
        title={t("socialPage.signInTitle")}
        description={t("socialPage.signInDescription")}
        action={
          <Link href="/sign-in">
            <Button>{t("socialPage.signInAction")}</Button>
          </Link>
        }
      />
    );
  }

  async function uploadMedia(file: File | undefined) {
    if (!userId || !file) return;
    setError("");
    const kind: MediaKind | null = file.type === "image/gif"
      ? "gif"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "image"
          : null;
    if (!kind) {
      setError("Bitte Bild oder Video auswählen.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("Medien dürfen maximal 30 MB groß sein.");
      return;
    }
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl({ userId, mediaType: kind });
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload fehlgeschlagen.");
      const result = (await response.json()) as { storageId: Id<"_storage"> };
      setMediaStorageId(result.storageId);
      setMediaType(kind);
      setMediaPreviewUrl(URL.createObjectURL(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadCommentGif(key: string, file: File | undefined) {
    if (!userId || !file) return;
    setError("");
    if (file.type !== "image/gif") {
      setError("Bitte eine GIF-Datei auswählen.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("GIFs dürfen maximal 15 MB groß sein.");
      return;
    }
    try {
      const postUrl = await generateUploadUrl({ userId, mediaType: "gif" });
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload fehlgeschlagen.");
      const result = (await response.json()) as { storageId: Id<"_storage"> };
      setCommentMediaDrafts({
        ...commentMediaDrafts,
        [key]: {
          storageId: result.storageId,
          mediaType: "gif",
          previewUrl: URL.createObjectURL(file),
        },
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    }
  }

  function clearPostMedia() {
    setMediaStorageId(undefined);
    setMediaType(undefined);
    setMediaPreviewUrl("");
    setMediaSize("lg");
    setMediaScale(100);
  }

  function clearStoryDraft() {
    setStoryBody("");
    setStoryMediaStorageId(undefined);
    setStoryMediaType(undefined);
    setStoryPreviewUrl("");
    setStoryError("");
  }

  function clearCommentGif(key: string) {
    setCommentMediaDrafts({ ...commentMediaDrafts, [key]: undefined });
  }

  async function uploadStoryMedia(file: File | undefined) {
    if (!userId || !file) return;
    setStoryError("");
    const kind: MediaKind | null = file.type === "image/gif"
      ? "gif"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "image"
          : null;
    if (!kind) {
      setStoryError("Bitte Bild oder Video auswählen.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setStoryError("Story-Medien dürfen maximal 30 MB groß sein.");
      return;
    }
    setStoryUploading(true);
    try {
      const postUrl = await generateUploadUrl({ userId, mediaType: kind });
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload fehlgeschlagen.");
      const result = (await response.json()) as { storageId: Id<"_storage"> };
      setStoryMediaStorageId(result.storageId);
      setStoryMediaType(kind);
      setStoryPreviewUrl(URL.createObjectURL(file));
    } catch (uploadError) {
      setStoryError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setStoryUploading(false);
    }
  }

  async function submitPost() {
    if (!userId) return;
    await createPost({
      authorId: userId,
      body,
      bodyAfter,
      mediaStorageId,
      mediaType,
      mediaSize,
      mediaScale,
    });
    setBody("");
    setBodyAfter("");
    setMediaStorageId(undefined);
    setMediaType(undefined);
    setMediaPreviewUrl("");
    setMediaSize("lg");
    setMediaScale(100);
  }

  async function submitStory() {
    if (!userId || (!storyBody.trim() && !storyMediaStorageId)) return;
    await createStory({
      authorId: userId,
      body: storyBody,
      mediaStorageId: storyMediaStorageId,
      mediaType: storyMediaType,
    });
    clearStoryDraft();
    setStoryDialogOpen(false);
  }

  async function openStory(storyId: Id<"social_stories">) {
    setSelectedStoryId(storyId);
    if (!userId) return;
    const story = stories?.find((entry) => entry._id === storyId);
    if (!story || story.isOwnStory || story.viewedByViewer) return;
    await markStoryViewed({ storyId, viewerId: userId });
  }

  async function submitComment(postId: Id<"social_posts">) {
    const mediaDraft = commentMediaDrafts[postId];
    if (!userId || (!commentBodies[postId]?.trim() && !mediaDraft)) return;
    await addComment({
      userId,
      postId,
      body: commentBodies[postId] ?? "",
      mediaStorageId: mediaDraft?.storageId,
      mediaType: mediaDraft?.mediaType,
    });
    setCommentBodies({ ...commentBodies, [postId]: "" });
    clearCommentGif(postId);
  }

  async function submitReply(postId: Id<"social_posts">, commentId: Id<"social_comments">) {
    const mediaDraft = commentMediaDrafts[commentId];
    if (!userId || (!replyBodies[commentId]?.trim() && !mediaDraft)) return;
    await addComment({
      userId,
      postId,
      parentCommentId: commentId,
      body: replyBodies[commentId] ?? "",
      mediaStorageId: mediaDraft?.storageId,
      mediaType: mediaDraft?.mediaType,
    });
    setReplyBodies({ ...replyBodies, [commentId]: "" });
    clearCommentGif(commentId);
    setReplyingToCommentId(null);
    setExpandedReplies({ ...expandedReplies, [commentId]: true });
  }

  async function repost(postId: Id<"social_posts">) {
    if (!userId) return;
    try {
      await createPost({ authorId: userId, body: "", repostOfPostId: postId });
    } catch (repostError) {
      setError(repostError instanceof Error ? repostError.message : "Repost fehlgeschlagen.");
    }
  }

  async function sendPostToFriend(friend: { username?: string; name: string } | null) {
    if (!userId || !shareDialogPostId || !friend?.username) return;
    await shareToUsername({ senderId: userId, postId: shareDialogPostId, username: friend.username });
    setShareMessage(`Gesendet an ${friend.name}`);
  }

  async function confirmDelete() {
    if (!userId || !pendingDelete) return;
    if (pendingDelete.kind === "post") {
      await deletePost({ userId, postId: pendingDelete.id });
      if (selectedPostId === pendingDelete.id) setSelectedPostId(null);
      setEditingPostId(null);
    } else {
      await deleteComment({ userId, commentId: pendingDelete.id });
      setEditingCommentId(null);
    }
    setPendingDelete(null);
  }

  const composer = (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 p-3 sm:p-4">
      <Avatar name={currentUser?.name ?? "User"} avatarUrl={currentUser?.avatarUrl ?? undefined} size="feed" />
      <div className="min-w-0 space-y-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={mediaPreviewUrl ? "" : t("socialPage.composerPlaceholder")}
          rows={body || mediaPreviewUrl ? 2 : 1}
          maxLength={1200}
          className="min-h-10 resize-none border-0 bg-transparent px-0 py-1 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {mediaPreviewUrl && (
          <>
            <MediaPreview
              mediaUrl={mediaPreviewUrl}
              mediaType={mediaType}
              mediaSize={mediaSize}
              mediaScale={mediaScale}
              resizable
              onScaleChange={setMediaScale}
              onRemove={clearPostMedia}
            />
            <Textarea
              value={bodyAfter}
              onChange={(event) => setBodyAfter(event.target.value)}
              placeholder=""
              rows={2}
              maxLength={1200}
              className="min-h-10 resize-none border-0 bg-transparent px-0 py-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <ImagePlus className="h-4 w-4" />
            <span className="sr-only">{uploading ? t("socialPage.uploadRunning") : t("socialPage.attachMedia")}</span>
            <input type="file" accept="image/*,video/*,.gif" className="sr-only" onChange={(event) => uploadMedia(event.target.files?.[0])} />
          </label>
          <Button className="rounded-xl" onClick={submitPost} disabled={!userId || uploading || (!body.trim() && !bodyAfter.trim() && !mediaStorageId)}>
            {t("socialPage.post")}
          </Button>
        </div>
      </div>
    </div>
  );

  if (selectedPostId) {
    return (
      <>
        <div data-flush className="-mx-3 -mt-3 min-h-full bg-background pb-[calc(env(safe-area-inset-bottom)+6.25rem)] text-foreground sm:-mx-5 md:-mx-6 lg:-mx-8">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/70 bg-background/94 px-4 py-4 backdrop-blur-xl">
            <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setSelectedPostId(null)} aria-label={t("socialPage.backToFeed")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-extrabold leading-none">{t("socialPage.threadTitle")}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{t("socialPage.threadSubtitle")}</p>
            </div>
          </div>

          {thread === undefined ? (
            <p className="p-4 text-sm text-muted-foreground">{t("socialPage.threadLoading")}</p>
          ) : thread === null ? (
            <p className="p-4 text-sm text-muted-foreground">{t("socialPage.threadNotFound")}</p>
          ) : (
            <>
              <div className="px-4 py-4">
                <SocialPostCard
                  post={thread.post}
                  userId={userId}
                  isThreadHeader
                  openPostMenuId={openPostMenuId}
                  editingPostId={editingPostId}
                  editingBody={editingPostBodies[thread.post._id] ?? thread.post.body ?? ""}
                  onOpenPostMenu={setOpenPostMenuId}
                  onEditPost={(post) => {
                    setEditingPostId(post._id);
                    setEditingPostBodies({ ...editingPostBodies, [post._id]: post.body ?? "" });
                    setOpenPostMenuId(null);
                  }}
                  onDeletePost={(postId) => setPendingDelete({ kind: "post", id: postId })}
                  onEditingBodyChange={(value) => setEditingPostBodies({ ...editingPostBodies, [thread.post._id]: value })}
                  onCancelEdit={() => setEditingPostId(null)}
                  onSaveEdit={() => {
                    if (!userId) return;
                    void updatePost({
                      userId,
                      postId: thread.post._id,
                      body: editingPostBodies[thread.post._id] ?? thread.post.body ?? "",
                      bodyAfter: thread.post.bodyAfter,
                      mediaSize: thread.post.mediaSize,
                      mediaScale: thread.post.mediaScale,
                    });
                    setEditingPostId(null);
                  }}
                  onLike={(postId) => userId && toggleLike({ userId, postId })}
                  onComment={(postId) => {
                    document.getElementById(`comment-input-${postId}`)?.focus();
                  }}
                  onRepost={repost}
                  onSave={(postId) => userId && toggleSave({ userId, postId })}
                  onShare={(postId) => {
                    setShareDialogPostId(postId);
                    setShareMessage("");
                  }}
                />
              </div>

              <div className="mx-4 overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/75 p-3 sm:p-4">
                <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
                  <Avatar name="User" size="sm" />
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        id={`comment-input-${thread.post._id}`}
                        placeholder={`Antwort an ${thread.post.author?.username ?? thread.post.author?.name ?? "User"} ...`}
                        value={commentBodies[thread.post._id] ?? ""}
                        onChange={(event) => setCommentBodies({ ...commentBodies, [thread.post._id]: event.target.value })}
                      />
                      {commentMediaDrafts[thread.post._id]?.previewUrl && (
                        <MediaPreview
                          mediaUrl={commentMediaDrafts[thread.post._id]!.previewUrl}
                          mediaType="gif"
                          compact
                          onRemove={() => clearCommentGif(thread.post._id)}
                        />
                      )}
                    </div>
                    <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      GIF
                      <input type="file" accept="image/gif,.gif" className="sr-only" onChange={(event) => uploadCommentGif(thread.post._id, event.target.files?.[0])} />
                    </label>
                    <Button size="icon" disabled={!userId || (!(commentBodies[thread.post._id] ?? "").trim() && !commentMediaDrafts[thread.post._id])} onClick={() => submitComment(thread.post._id)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
                <button type="button" className="inline-flex items-center gap-1 font-medium">
                  {t("socialPage.popular")}
                </button>
                <span className="text-muted-foreground">{thread.comments.length} {t("socialPage.comments")}</span>
              </div>

              {thread.comments.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">{t("socialPage.noComments")}</p>
              ) : (
                <div>
                  {thread.comments.map((comment) => (
                    <CommentThread
                      key={comment._id}
                      comment={comment}
                      userId={userId}
                      expanded={Boolean(expandedReplies[comment._id])}
                      replying={replyingToCommentId === comment._id}
  replyBody={replyBodies[comment._id] ?? ""}
                      replyMedia={commentMediaDrafts[comment._id]}
                      editingCommentId={editingCommentId}
                      editingCommentBodies={editingCommentBodies}
                      openCommentMenuId={openCommentMenuId}
                      onToggleExpanded={() => setExpandedReplies({ ...expandedReplies, [comment._id]: !expandedReplies[comment._id] })}
                      onReplyToggle={() => setReplyingToCommentId(replyingToCommentId === comment._id ? null : comment._id)}
                      onReplyBodyChange={(value) => setReplyBodies({ ...replyBodies, [comment._id]: value })}
                      onReplyGif={(file) => uploadCommentGif(comment._id, file)}
                      onClearReplyGif={() => clearCommentGif(comment._id)}
                      onSubmitReply={() => submitReply(thread.post._id, comment._id)}
                      onLike={(commentId) => userId && toggleCommentLike({ userId, commentId })}
                      onOpenCommentMenu={setOpenCommentMenuId}
                      onEditComment={(commentId, body) => {
                        setEditingCommentId(commentId);
                        setEditingCommentBodies({ ...editingCommentBodies, [commentId]: body });
                        setOpenCommentMenuId(null);
                      }}
                      onDeleteComment={(commentId) => setPendingDelete({ kind: "comment", id: commentId })}
                      onEditingBodyChange={(commentId, value) => setEditingCommentBodies({ ...editingCommentBodies, [commentId]: value })}
                      onCancelEdit={() => setEditingCommentId(null)}
                      onSaveEdit={(commentId, body) => {
                        if (!userId) return;
                        void updateComment({
                          userId,
                          commentId,
                          body: editingCommentBodies[commentId] ?? body,
                        });
                        setEditingCommentId(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <DeleteDialog pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
      </>
    );
  }

  return (
    <>
      <div data-flush className="-mx-3 -mt-3 min-h-full bg-background pb-[calc(env(safe-area-inset-bottom)+6.25rem)] text-foreground sm:-mx-5 md:-mx-6 lg:-mx-8">
        <div className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur-xl">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-4">
            {([
              { id: "forYou" as const, label: t("socialPage.forYou") },
              { id: "following" as const, label: t("socialPage.following") },
            ]).map(({ id, label }) => {
              const selected = activeFeedTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    "relative flex h-[4.5rem] min-w-0 items-center justify-center px-3 text-base font-extrabold transition-colors",
                    selected ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveFeedTab(id)}
                >
                  <span className="truncate">{label}</span>
                  <span
                    className={cn(
                      "absolute bottom-0 h-0.5 rounded-full transition-all duration-300",
                      selected ? "w-28 bg-primary" : "w-0 bg-transparent"
                    )}
                  />
                </button>
              );
            })}
            <button
              type="button"
              className="flex h-[4.5rem] w-14 items-center justify-center text-muted-foreground transition hover:text-foreground"
              aria-label="Feed filtern"
            >
              <SlidersHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>

        <StoryRail
          stories={stories}
          currentUser={currentUser ? { name: currentUser.name, avatarUrl: currentUser.avatarUrl ?? undefined } : null}
          onCreate={() => setStoryDialogOpen(true)}
          onOpenStory={openStory}
        />
        <ActivityRail loading={posts === undefined} />

        <div className="px-4 pb-2">
          <div className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/75 shadow-xl shadow-background/25 backdrop-blur-xl">
            {composer}
          </div>
        </div>

        {posts === undefined ? (
          <div className="space-y-3 px-4 py-5">
            <div className="h-72 animate-pulse rounded-[1.35rem] border border-border/70 bg-muted/35" />
            <div className="h-64 animate-pulse rounded-[1.35rem] border border-border/70 bg-muted/30" />
          </div>
        ) : posts.length === 0 ? (
          <div className="mx-4 flex min-h-52 items-center justify-center rounded-[1.35rem] border border-border/80 bg-card/70 p-6 text-center text-sm text-muted-foreground">
            <div>
              <p className="text-base font-semibold text-foreground">{emptyFeedCopy}</p>
              <p className="mt-2 text-sm">{feedDescription}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 px-4 py-4">
            {posts.map((post) => (
              <SocialPostCard
                key={post._id}
                post={post}
                userId={userId}
                openPostMenuId={openPostMenuId}
                editingPostId={editingPostId}
                editingBody={editingPostBodies[post._id] ?? post.body ?? ""}
                onOpenPostMenu={setOpenPostMenuId}
                onEditPost={(postToEdit) => {
                  setEditingPostId(postToEdit._id);
                  setEditingPostBodies({ ...editingPostBodies, [postToEdit._id]: postToEdit.body ?? "" });
                  setOpenPostMenuId(null);
                }}
                onDeletePost={(postId) => setPendingDelete({ kind: "post", id: postId })}
                onEditingBodyChange={(value) => setEditingPostBodies({ ...editingPostBodies, [post._id]: value })}
                onCancelEdit={() => setEditingPostId(null)}
                onSaveEdit={() => {
                  if (!userId) return;
                  void updatePost({
                    userId,
                    postId: post._id,
                    body: editingPostBodies[post._id] ?? post.body ?? "",
                    bodyAfter: post.bodyAfter,
                    mediaSize: post.mediaSize,
                    mediaScale: post.mediaScale,
                  });
                  setEditingPostId(null);
                }}
                onLike={(postId) => userId && toggleLike({ userId, postId })}
                onComment={setSelectedPostId}
                onRepost={repost}
                onSave={(postId) => userId && toggleSave({ userId, postId })}
                onShare={(postId) => {
                  setShareDialogPostId(postId);
                  setShareMessage("");
                }}
              />
            ))}
          </div>
        )}
      </div>
      <ShareDialog
        open={Boolean(shareDialogPostId)}
        friends={friends}
        query={shareQuery}
        message={shareMessage}
        onQueryChange={setShareQuery}
        onClose={() => {
          setShareDialogPostId(null);
          setShareQuery("");
          setShareMessage("");
        }}
        onSend={(friend) => void sendPostToFriend(friend)}
      />
      <StoryComposerDialog
        open={storyDialogOpen}
        body={storyBody}
        previewUrl={storyPreviewUrl}
        mediaType={storyMediaType}
        uploading={storyUploading}
        error={storyError}
        onOpenChange={(open) => {
          setStoryDialogOpen(open);
          if (!open) clearStoryDraft();
        }}
        onBodyChange={setStoryBody}
        onFile={uploadStoryMedia}
        onClearMedia={() => {
          setStoryMediaStorageId(undefined);
          setStoryMediaType(undefined);
          setStoryPreviewUrl("");
        }}
        onSubmit={submitStory}
        disabled={!userId || storyUploading || (!storyBody.trim() && !storyMediaStorageId)}
      />
      <StoryViewerDialog story={selectedStory} onClose={() => setSelectedStoryId(null)} />
      <DeleteDialog pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
    </>
  );
}

type SocialStory = {
  _id: Id<"social_stories">;
  authorId: Id<"users">;
  body?: string;
  mediaUrl?: string | null;
  mediaType?: MediaKind;
  createdAt: number;
  expiresAt: number;
  author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
  isOwnStory: boolean;
  viewedByViewer: boolean;
};

function StoryRail({
  stories,
  currentUser,
  onCreate,
  onOpenStory,
}: {
  stories: SocialStory[] | undefined;
  currentUser: { name: string; avatarUrl?: string } | null;
  onCreate: () => void;
  onOpenStory: (storyId: Id<"social_stories">) => void;
}) {
  return (
    <section className="border-b border-border/60 py-5" aria-label="Storys">
      <div className="flex gap-5 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" className="min-w-[5.25rem] text-center" onClick={onCreate}>
          <span className="relative mx-auto flex h-[4.45rem] w-[4.45rem] items-center justify-center rounded-full border border-primary/45 bg-primary/10 text-primary">
            <ImagePlus className="h-6 w-6" />
          </span>
          <span className="mt-2 block truncate text-sm font-semibold text-muted-foreground">Story erstellen</span>
        </button>

        {stories === undefined ? (
          <div className="flex min-w-[12rem] items-center text-sm text-muted-foreground">Storys werden geladen...</div>
        ) : stories.length === 0 ? (
          <div className="flex min-w-[12rem] items-center text-sm text-muted-foreground">Noch keine Storys</div>
        ) : (
          stories.map((story) => {
            const authorName = story.author?.username ?? story.author?.name ?? "User";
            return (
              <button key={story._id} type="button" className="min-w-[5.25rem] text-center" onClick={() => onOpenStory(story._id)}>
                <span
                  className={cn(
                    "relative mx-auto flex h-[4.45rem] w-[4.45rem] items-center justify-center rounded-full p-[2px]",
                    story.viewedByViewer && "opacity-75"
                  )}
                  style={{
                    background:
                      story.viewedByViewer
                        ? "linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 46%, transparent), color-mix(in oklch, var(--muted-foreground) 34%, var(--background)), color-mix(in oklch, var(--muted-foreground) 22%, transparent))"
                        : "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 72%, white), color-mix(in oklch, var(--primary) 45%, transparent))",
                  }}
                >
                  <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-card text-sm font-extrabold text-foreground">
                    {story.mediaUrl && story.mediaType !== "video" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Avatar name={story.author?.name ?? currentUser?.name ?? "?"} avatarUrl={story.author?.avatarUrl ?? undefined} size="story" />
                    )}
                  </span>
                  {story.isOwnStory && (
                    <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-primary px-1.5 text-[0.62rem] font-bold text-primary-foreground">
                      Du
                    </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-muted-foreground">{authorName}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function StoryComposerDialog({
  open,
  body,
  previewUrl,
  mediaType,
  uploading,
  error,
  disabled,
  onOpenChange,
  onBodyChange,
  onFile,
  onClearMedia,
  onSubmit,
}: {
  open: boolean;
  body: string;
  previewUrl: string;
  mediaType?: MediaKind;
  uploading: boolean;
  error: string;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onBodyChange: (value: string) => void;
  onFile: (file: File | undefined) => void;
  onClearMedia: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[1.35rem] border-border bg-popover p-0" showCloseButton={false}>
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <DialogTitle className="text-base font-extrabold">Story erstellen</DialogTitle>
          <Button size="icon-sm" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)} aria-label="Schließen">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <Textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="Was passiert gerade?"
            maxLength={280}
            rows={3}
            className="border-border/80 bg-card/55 text-base"
          />
          {previewUrl && (
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-background/40">
              <button type="button" className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-2 text-white" onClick={onClearMedia} aria-label="Medium entfernen">
                <X className="h-4 w-4" />
              </button>
              {mediaType === "video" ? (
                <video src={previewUrl} controls className="max-h-96 w-full bg-black object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="max-h-96 w-full object-cover" />
              )}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border/80 bg-card/55 px-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Upload..." : "Medium"}
              <input type="file" accept="image/*,video/*,.gif" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
            <Button className="rounded-xl" disabled={disabled} onClick={onSubmit}>
              Posten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StoryViewerDialog({ story, onClose }: { story: SocialStory | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(story)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-[1.35rem] border-border bg-popover p-0" showCloseButton={false}>
        {story && (
          <>
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={story.author?.name ?? "?"} avatarUrl={story.author?.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{story.author?.username ?? story.author?.name ?? "Unbekannt"}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(story.createdAt)}</p>
                </div>
              </div>
              <Button size="icon-sm" variant="ghost" className="rounded-full" onClick={onClose} aria-label="Schließen">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-black">
              {story.mediaUrl ? (
                story.mediaType === "video" ? (
                  <video src={story.mediaUrl} controls autoPlay className="max-h-[70vh] w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.mediaUrl} alt="" className="max-h-[70vh] w-full object-contain" />
                )
              ) : (
                <div className="flex min-h-80 items-center justify-center p-8 text-center text-2xl font-extrabold">{story.body}</div>
              )}
            </div>
            {story.mediaUrl && story.body && <p className="p-4 text-base font-semibold">{story.body}</p>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActivityRail({
  loading = false,
}: {
  loading?: boolean;
}) {
  return (
    <section className="border-b border-border/60 py-4" aria-label="Neue Aktivitäten">
      <h2 className="mb-3 flex items-center gap-2 px-4 text-lg font-extrabold">
        <Sparkles className="h-4 w-4 fill-primary text-primary" />
        Neue Aktivitäten
      </h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <>
            <div className="h-[6.35rem] min-w-[11.5rem] animate-pulse rounded-2xl border border-border/70 bg-muted/35" />
            <div className="h-[6.35rem] min-w-[11.5rem] animate-pulse rounded-2xl border border-border/70 bg-muted/30" />
          </>
        ) : (
          <div className="flex min-h-[6.35rem] min-w-[15rem] items-center rounded-2xl border border-border/70 bg-card/55 px-4 text-sm text-muted-foreground">
            Noch keine Aktivitäten
          </div>
        )}
      </div>
    </section>
  );
}

export function SocialPostCard({
  post,
  userId,
  isThreadHeader = false,
  openPostMenuId,
  editingPostId,
  editingBody,
  onOpenPostMenu,
  onEditPost,
  onDeletePost,
  onEditingBodyChange,
  onCancelEdit,
  onSaveEdit,
  onLike,
  onComment,
  onRepost,
  onSave,
  onShare,
}: {
  post: {
    _id: Id<"social_posts">;
    authorId: Id<"users">;
    body: string;
    bodyAfter?: string;
    createdAt: number;
    updatedAt?: number;
    mediaUrl?: string | null;
    mediaType?: MediaKind;
    mediaSize?: MediaSize;
    mediaScale?: number;
    mediaStorageId?: Id<"_storage">;
    linkedSubmissionId?: Id<"log_submissions">;
    repostOfPostId?: Id<"social_posts">;
    author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
    likedByViewer: boolean;
    savedByViewer: boolean;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    repostedByViewer: boolean;
    repostOf?: null | {
      _id: Id<"social_posts">;
      body: string;
      bodyAfter?: string;
      createdAt: number;
      mediaUrl?: string | null;
      mediaType?: MediaKind;
      mediaSize?: MediaSize;
      mediaScale?: number;
      author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
      linkedLog: null | { exerciseName: string | null; weightKg: number; reps: number; score?: number };
    };
    linkedLog: null | { exerciseName: string | null; weightKg: number; reps: number; score?: number };
  };
  userId: Id<"users"> | undefined;
  isThreadHeader?: boolean;
  openPostMenuId: string | null;
  editingPostId: string | null;
  editingBody: string;
  onOpenPostMenu: (postId: string | null) => void;
  onEditPost: (post: { _id: Id<"social_posts">; body?: string }) => void;
  onDeletePost: (postId: Id<"social_posts">) => void;
  onEditingBodyChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onLike: (postId: Id<"social_posts">) => void;
  onComment: (postId: Id<"social_posts">) => void;
  onRepost: (postId: Id<"social_posts">) => void;
  onSave: (postId: Id<"social_posts">) => void;
  onShare: (postId: Id<"social_posts">) => void;
}) {
  const isOwnPost = Boolean(userId && post.author?._id === userId);
  const isEditing = editingPostId === post._id;
  const canRepost = Boolean(userId && !isOwnPost && !post.repostedByViewer && !post.repostOfPostId);
  const { t } = useAppPreferences();
  const edited = Boolean(post.updatedAt && post.updatedAt > post.createdAt);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/75 p-4 shadow-xl shadow-background/25 transition-colors",
        isThreadHeader ? "rounded-none border-x-0 border-t-0 bg-background shadow-none" : "cursor-pointer hover:border-primary/35 hover:bg-card/90"
      )}
      onClick={(event) => {
        if (isThreadHeader) return;
        const target = event.target as HTMLElement;
        if (target.closest("button,a,input,textarea,label,video")) return;
        onComment(post._id);
      }}
    >
      <div className="space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={post.author?.name ?? "?"} avatarUrl={post.author?.avatarUrl ?? undefined} size="feed" />
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-base leading-5">
                <Link href={post.author ? `/profile/${post.author._id}` : "/social"} className="min-w-0 truncate font-extrabold hover:underline">
                  {post.author?.username ?? post.author?.name ?? "Unbekannt"}
                </Link>
                {post.author?.isPro && <CheckCircle2 className="h-4 w-4 shrink-0 fill-primary text-background" />}
                {post.repostOfPostId && <span className="text-muted-foreground">reposted</span>}
                <span className="text-muted-foreground">·</span>
                <time className="text-sm text-muted-foreground" title={new Date(post.createdAt).toLocaleString("de-DE")}>
                  {formatRelativeTime(post.createdAt)}
                </time>
                {edited && <span className="text-sm text-muted-foreground">{t("socialPage.edited")}</span>}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">Öffentlich</p>
            </div>
          </div>
            {isOwnPost && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Post-Optionen"
                  className="-mt-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onOpenPostMenu(openPostMenuId === post._id ? null : post._id)}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
                {openPostMenuId === post._id && (
                  <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-background/30">
                    <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition hover:bg-muted" onClick={() => onEditPost(post)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Bearbeiten
                    </button>
                    <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-destructive transition hover:bg-destructive/10" onClick={() => onDeletePost(post._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea value={editingBody} onChange={(event) => onEditingBodyChange(event.target.value)} rows={3} maxLength={1200} className="min-h-24 text-[0.95rem]" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancelEdit}>Abbrechen</Button>
                <Button onClick={onSaveEdit} disabled={!editingBody.trim() && !post.mediaStorageId && !post.mediaUrl && !post.linkedSubmissionId && !post.repostOfPostId}>
                  Speichern
                </Button>
              </div>
            </div>
          ) : (
            post.body && <p className="whitespace-pre-wrap text-[1.02rem] font-semibold leading-6 text-foreground">{post.body}</p>
          )}

          {post.mediaUrl && (
            <MediaPreview
              mediaUrl={post.mediaUrl}
              mediaType={post.mediaType}
              mediaSize={post.mediaSize ?? "lg"}
              mediaScale={post.mediaScale}
              cover
            />
          )}
          {post.linkedLog && <LinkedLogCard linkedLog={post.linkedLog} />}
          {post.bodyAfter && <p className="whitespace-pre-wrap text-[0.95rem] leading-6 text-muted-foreground">{post.bodyAfter}</p>}
          {post.repostOf && <QuotedPost post={post.repostOf} onOpen={() => onComment(post.repostOf!._id)} />}

          <div className="grid grid-cols-5 items-center pt-1 text-muted-foreground">
            <ActionButton active={post.likedByViewer} activeClass="text-rose-500 hover:text-rose-500" onClick={() => onLike(post._id)} ariaLabel={post.likedByViewer ? "Like entfernen" : "Liken"}>
              <Heart className={cn("h-5 w-5", post.likedByViewer && "fill-current")} />
              <span>{post.likeCount}</span>
            </ActionButton>
            <ActionButton onClick={() => onComment(post._id)} ariaLabel="Kommentare öffnen">
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentCount}</span>
            </ActionButton>
            <ActionButton
              active={post.repostedByViewer}
              activeClass="text-primary hover:text-primary"
              disabled={!canRepost}
              onClick={() => onRepost(post._id)}
              ariaLabel={
                isOwnPost
                  ? "Eigene Posts können nicht repostet werden"
                  : post.repostedByViewer
                    ? "Bereits repostet"
                    : "Reposten"
              }
            >
              <Repeat2 className="h-5 w-5" />
              <span>{post.repostCount}</span>
            </ActionButton>
            <ActionButton
              active={post.savedByViewer}
              activeClass="text-primary hover:text-primary"
              disabled={!userId}
              onClick={() => onSave(post._id)}
              ariaLabel={post.savedByViewer ? "Gespeicherten Beitrag entfernen" : "Post speichern"}
            >
              <Bookmark className={cn("h-5 w-5", post.savedByViewer && "fill-current")} />
            </ActionButton>
            <ActionButton onClick={() => onShare(post._id)} ariaLabel="Teilen">
              <Share2 className="h-5 w-5" />
            </ActionButton>
          </div>
          {!isThreadHeader && post.commentCount > 0 && (
            <button type="button" className="text-left text-sm text-muted-foreground transition hover:text-foreground" onClick={() => onComment(post._id)}>
              Alle {post.commentCount} Kommentare anzeigen
            </button>
          )}
        </div>
    </article>
  );
}

function CommentThread({
  comment,
  userId,
  expanded,
  replying,
  replyBody,
  replyMedia,
  editingCommentId,
  editingCommentBodies,
  openCommentMenuId,
  onToggleExpanded,
  onReplyToggle,
  onReplyBodyChange,
  onReplyGif,
  onClearReplyGif,
  onSubmitReply,
  onLike,
  onOpenCommentMenu,
  onEditComment,
  onDeleteComment,
  onEditingBodyChange,
  onCancelEdit,
  onSaveEdit,
}: {
  comment: {
    _id: Id<"social_comments">;
    authorId: Id<"users">;
    body: string;
    createdAt: number;
    updatedAt?: number;
    mediaUrl?: string | null;
    mediaType?: "gif";
    author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
    likeCount: number;
    likedByViewer: boolean;
    replies: Array<{
      _id: Id<"social_comments">;
      authorId: Id<"users">;
      body: string;
      createdAt: number;
      updatedAt?: number;
      mediaUrl?: string | null;
      mediaType?: "gif";
      author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
      likeCount: number;
      likedByViewer: boolean;
    }>;
    replyCount: number;
  };
  userId: Id<"users"> | undefined;
  expanded: boolean;
  replying: boolean;
  replyBody: string;
  replyMedia?: CommentMediaDraft;
  editingCommentId: string | null;
  editingCommentBodies: Record<string, string>;
  openCommentMenuId: string | null;
  onToggleExpanded: () => void;
  onReplyToggle: () => void;
  onReplyBodyChange: (value: string) => void;
  onReplyGif: (file: File | undefined) => void;
  onClearReplyGif: () => void;
  onSubmitReply: () => void;
  onLike: (commentId: Id<"social_comments">) => void;
  onOpenCommentMenu: (commentId: string | null) => void;
  onEditComment: (commentId: Id<"social_comments">, body: string) => void;
  onDeleteComment: (commentId: Id<"social_comments">) => void;
  onEditingBodyChange: (commentId: Id<"social_comments">, value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentId: Id<"social_comments">, body: string) => void;
}) {
  const shownReplies = expanded ? comment.replies : comment.replies.slice(0, 1);
  const hiddenReplyCount = Math.max(0, comment.replyCount - shownReplies.length);

  return (
    <div className="border-b border-border p-3 last:border-b-0 sm:p-4">
      <CommentItem
        comment={comment}
        userId={userId}
        isEditing={editingCommentId === comment._id}
        editingBody={editingCommentBodies[comment._id] ?? comment.body}
        openCommentMenuId={openCommentMenuId}
        onLike={() => onLike(comment._id)}
        onReply={onReplyToggle}
        onOpenCommentMenu={onOpenCommentMenu}
        onEditComment={() => onEditComment(comment._id, comment.body)}
        onDeleteComment={() => onDeleteComment(comment._id)}
        onEditingBodyChange={(value) => onEditingBodyChange(comment._id, value)}
        onCancelEdit={onCancelEdit}
        onSaveEdit={() => onSaveEdit(comment._id, comment.body)}
      />

      {shownReplies.length > 0 && (
        <div className="ml-5 mt-3 space-y-3 border-l border-border pl-4">
          {shownReplies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              userId={userId}
              isReply
              isEditing={editingCommentId === reply._id}
              editingBody={editingCommentBodies[reply._id] ?? reply.body}
              openCommentMenuId={openCommentMenuId}
              onLike={() => onLike(reply._id)}
              onOpenCommentMenu={onOpenCommentMenu}
              onEditComment={() => onEditComment(reply._id, reply.body)}
              onDeleteComment={() => onDeleteComment(reply._id)}
              onEditingBodyChange={(value) => onEditingBodyChange(reply._id, value)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={() => onSaveEdit(reply._id, reply.body)}
            />
          ))}
        </div>
      )}

      {hiddenReplyCount > 0 && (
        <button type="button" className="ml-9 mt-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground" onClick={onToggleExpanded}>
          <MessageCircle className="h-3.5 w-3.5" />
          {expanded ? "Antworten einklappen" : `${hiddenReplyCount} Antworten anzeigen`}
        </button>
      )}

      {replying && (
        <div className="ml-9 mt-3 flex gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Input value={replyBody} onChange={(event) => onReplyBodyChange(event.target.value)} placeholder="Antwort schreiben..." />
            {replyMedia?.previewUrl && (
              <MediaPreview mediaUrl={replyMedia.previewUrl} mediaType="gif" compact onRemove={onClearReplyGif} />
            )}
          </div>
          <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
            GIF
            <input type="file" accept="image/gif,.gif" className="sr-only" onChange={(event) => onReplyGif(event.target.files?.[0])} />
          </label>
          <Button size="icon" disabled={!replyBody.trim() && !replyMedia} onClick={onSubmitReply}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  userId,
  isReply = false,
  isEditing,
  editingBody,
  openCommentMenuId,
  onLike,
  onReply,
  onOpenCommentMenu,
  onEditComment,
  onDeleteComment,
  onEditingBodyChange,
  onCancelEdit,
  onSaveEdit,
}: {
  comment: CommentLike;
  userId: Id<"users"> | undefined;
  isReply?: boolean;
  isEditing: boolean;
  editingBody: string;
  openCommentMenuId: string | null;
  onLike: () => void;
  onReply?: () => void;
  onOpenCommentMenu: (commentId: string | null) => void;
  onEditComment: () => void;
  onDeleteComment: () => void;
  onEditingBodyChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}) {
  const isOwnComment = Boolean(userId && comment.author?._id === userId);
  const { t } = useAppPreferences();
  const edited = Boolean(comment.updatedAt && comment.updatedAt > comment.createdAt);

  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 text-sm">
      <Avatar name={comment.author?.name ?? "?"} avatarUrl={comment.author?.avatarUrl ?? undefined} size="sm" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-5">
              {comment.author?.username ?? comment.author?.name ?? "Unbekannt"}
              <span className="ml-2 font-normal text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
              {edited && <span className="ml-2 font-normal text-muted-foreground">{t("socialPage.edited")}</span>}
            </p>
          </div>
          {isOwnComment && (
            <div className="relative">
              <button type="button" className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" onClick={() => onOpenCommentMenu(openCommentMenuId === comment._id ? null : comment._id)} aria-label="Kommentar-Optionen">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {openCommentMenuId === comment._id && (
                <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-sm">
                  <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition hover:bg-muted" onClick={onEditComment}>
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </button>
                  <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-destructive transition hover:bg-destructive/10" onClick={onDeleteComment}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea value={editingBody} onChange={(event) => onEditingBodyChange(event.target.value)} rows={2} maxLength={500} className="min-h-16 text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>Abbrechen</Button>
              <Button size="sm" disabled={!editingBody.trim()} onClick={onSaveEdit}>Speichern</Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-5">{comment.body}</p>
        )}

        {comment.mediaUrl && (
          <div className="mt-2">
            <MediaPreview mediaUrl={comment.mediaUrl} mediaType={comment.mediaType} compact />
          </div>
        )}

        <div className="mt-2 flex items-center gap-5 text-xs text-muted-foreground">
          <button type="button" className={`inline-flex items-center gap-1 transition ${comment.likedByViewer ? "text-rose-500 hover:text-rose-500" : "hover:text-rose-500"}`} onClick={onLike}>
            <Heart className={`h-3.5 w-3.5 ${comment.likedByViewer ? "fill-current" : ""}`} />
            <span>{comment.likeCount}</span>
          </button>
          {!isReply && (
            <button type="button" className="transition hover:text-foreground" onClick={onReply}>
              Antworten
            </button>
          )}
          <button type="button" className="transition hover:text-foreground" aria-label="Kommentar teilen">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

type CommentLike = {
  _id: Id<"social_comments">;
  body: string;
  createdAt: number;
  updatedAt?: number;
  author: null | { _id: Id<"users">; name: string; username?: string; avatarUrl?: string | null; isPro: boolean };
  mediaUrl?: string | null;
  mediaType?: "gif";
  likeCount: number;
  likedByViewer: boolean;
};

function ActionButton({
  children,
  active = false,
  activeClass = "text-foreground",
  ariaLabel,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-1 text-base transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 ${active ? activeClass : ""}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function QuotedPost({
  post,
  onOpen,
}: {
  post: {
    _id: Id<"social_posts">;
    body: string;
    bodyAfter?: string;
    mediaUrl?: string | null;
    mediaType?: MediaKind;
    mediaSize?: MediaSize;
    mediaScale?: number;
    author: null | { name: string; username?: string; avatarUrl?: string | null };
    linkedLog: null | { exerciseName: string | null; weightKg: number; reps: number; score?: number };
  };
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="block w-full rounded-lg border border-border bg-muted/20 p-3 text-left transition hover:bg-muted/35"
      onClick={onOpen}
      aria-label="Originalen Beitrag öffnen"
    >
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Avatar name={post.author?.name ?? "?"} avatarUrl={post.author?.avatarUrl ?? undefined} size="sm" />
        <span className="font-medium">{post.author?.username ?? post.author?.name ?? "Unbekannt"}</span>
      </div>
      {post.body && <p className="whitespace-pre-wrap text-sm leading-5">{post.body}</p>}
      {post.linkedLog && <LinkedLogCard linkedLog={post.linkedLog} compact />}
      {post.mediaUrl && (
        <div className="mt-2">
          <MediaPreview
            mediaUrl={post.mediaUrl}
            mediaType={post.mediaType}
            mediaSize={post.mediaSize ?? "md"}
            mediaScale={post.mediaScale}
            compact
          />
        </div>
      )}
      {post.bodyAfter && <p className="mt-2 whitespace-pre-wrap text-sm leading-5">{post.bodyAfter}</p>}
    </button>
  );
}

function LinkedLogCard({
  linkedLog,
  compact = false,
}: {
  linkedLog: { exerciseName: string | null; weightKg: number; reps: number; score?: number };
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-primary/35 bg-primary/[0.06] ${compact ? "mt-2 p-2 text-xs" : "p-4 text-sm"}`}>
      <Badge className="mb-2 gap-1 border-primary/40 bg-primary/15 text-primary">
        <Video className="h-3 w-3" />
        Top Log
      </Badge>
      <p className="font-medium">{linkedLog.exerciseName}</p>
      <p className="text-muted-foreground">
        {linkedLog.weightKg} kg x {linkedLog.reps} · Score {linkedLog.score ?? "-"}
      </p>
    </div>
  );
}

function MediaPreview({
  mediaUrl,
  mediaType,
  mediaSize = "lg",
  mediaScale,
  compact = false,
  cover = false,
  resizable = false,
  onScaleChange,
  onRemove,
}: {
  mediaUrl: string;
  mediaType?: MediaKind;
  mediaSize?: MediaSize;
  mediaScale?: number;
  compact?: boolean;
  cover?: boolean;
  resizable?: boolean;
  onScaleChange?: (value: number) => void;
  onRemove?: () => void;
}) {
  const { t } = useAppPreferences();
  const frameRef = useRef<HTMLDivElement>(null);
  const fallbackScale = mediaSize === "sm" ? 45 : mediaSize === "md" ? 70 : 100;
  const currentScale = Math.min(100, Math.max(35, mediaScale ?? fallbackScale));
  const heightClass = compact ? "max-h-56" : cover ? "aspect-[1.55/1] max-h-[34rem]" : "max-h-[32rem]";
  const mediaFitClass = cover ? "object-cover" : "object-contain";

  function resizeFromPointer(clientX: number) {
    const parent = frameRef.current?.parentElement;
    if (!parent || !onScaleChange) return;
    const rect = parent.getBoundingClientRect();
    const nextScale = ((clientX - rect.left) / rect.width) * 100;
    onScaleChange(Math.round(Math.min(100, Math.max(35, nextScale))));
  }

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      resizeFromPointer(moveEvent.clientX);
    };
    const stopResize = () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    resizeFromPointer(event.clientX);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

  return (
    <div
      ref={frameRef}
      className={`relative select-none rounded-2xl border bg-black/30 ${resizable ? "overflow-visible" : "overflow-hidden"} ${
        resizable ? "border-dashed border-foreground/70" : "border-border/80"
      }`}
      style={{ width: compact ? "100%" : `${currentScale}%` }}
    >
      {onRemove && (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
          onClick={onRemove}
          aria-label={t("socialPage.removeMedia")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {mediaType === "video" ? (
        <video src={mediaUrl} controls className={`${heightClass} w-full rounded-2xl bg-black ${mediaFitClass}`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" className={`${heightClass} w-full rounded-2xl ${mediaFitClass}`} />
      )}
      {resizable && onScaleChange && (
        <>
          <span className="absolute -left-1 -top-1 size-2 border border-foreground bg-background" />
          <span className="absolute left-1/2 -top-1 size-2 -translate-x-1/2 border border-foreground bg-background" />
          <span className="absolute -right-1 -top-1 size-2 border border-foreground bg-background" />
          <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 border border-foreground bg-background" />
          <button
            type="button"
            className="absolute -right-3 top-1/2 z-20 flex size-7 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center"
            onPointerDown={startResize}
            aria-label="Bildgröße ziehen"
          >
            <span className="size-3 border border-foreground bg-background" />
          </button>
          <span className="absolute -bottom-1 -left-1 size-2 border border-foreground bg-background" />
          <span className="absolute bottom-[-3px] left-1/2 size-2 -translate-x-1/2 border border-foreground bg-background" />
          <button
            type="button"
            className="absolute -bottom-3 -right-3 z-20 flex size-8 cursor-nwse-resize touch-none items-center justify-center"
            onPointerDown={startResize}
            aria-label="Bildgröße ziehen"
          >
            <span className="size-3 border border-foreground bg-background" />
          </button>
        </>
      )}
    </div>
  );
}

function DeprecatedMediaSizeControl({
  value,
  onChange,
}: {
  value: MediaSize;
  onChange: (value: MediaSize) => void;
}) {
  const sliderValue = value === "sm" ? 0 : value === "md" ? 1 : 2;
  const fromSliderValue = (nextValue: number): MediaSize =>
    nextValue === 0 ? "sm" : nextValue === 1 ? "md" : "lg";

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={sliderValue}
        onChange={(event) => onChange(fromSliderValue(Number(event.target.value)))}
        className="h-2 w-full cursor-pointer accent-foreground"
        aria-label="Bildgröße"
      />
      <div className="mt-2 grid grid-cols-3 text-xs text-muted-foreground">
        <span>Klein</span>
        <span className="text-center">Mittel</span>
        <span className="text-right">Groß</span>
      </div>
    </div>
  );
}

void DeprecatedMediaSizeControl;

function DeleteDialog({
  pendingDelete,
  onCancel,
  onConfirm,
}: {
  pendingDelete: { kind: "post"; id: Id<"social_posts"> } | { kind: "comment"; id: Id<"social_comments"> } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xs gap-3 rounded-lg p-4" showCloseButton={false}>
        <DialogHeader className="gap-1">
          <DialogTitle className="text-sm">{pendingDelete?.kind === "post" ? "Post löschen?" : "Kommentar löschen?"}</DialogTitle>
          <DialogDescription className="text-xs">Diese Aktion kann nicht rückgängig gemacht werden.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-4 -mb-4 flex-row justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>Abbrechen</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({
  open,
  friends,
  query,
  message,
  onQueryChange,
  onClose,
  onSend,
}: {
  open: boolean;
  friends:
    | Array<{
        friendshipId: Id<"friends">;
        friend: null | {
          _id: Id<"users">;
          name: string;
          username?: string;
          avatarUrl?: string | null;
          isPro: boolean;
        };
      }>
    | undefined;
  query: string;
  message: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSend: (friend: { username?: string; name: string } | null) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFriends =
    friends?.filter((entry) => {
      const friend = entry.friend;
      if (!friend) return false;
      if (!normalizedQuery) return true;
      return (
        friend.name.toLowerCase().includes(normalizedQuery) ||
        friend.username?.toLowerCase().includes(normalizedQuery)
      );
    }) ?? [];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[82vh] max-w-xl overflow-hidden rounded-xl p-0" showCloseButton={false}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4 py-3">
          <button type="button" className="justify-self-start text-sm text-muted-foreground transition hover:text-foreground" onClick={onClose}>
            Abbrechen
          </button>
          <DialogTitle className="text-sm font-semibold">Senden an</DialogTitle>
          <span />
        </div>

        <div className="space-y-3 p-4">
          <label className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-muted/20 px-4 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Nach Freunden suchen"
              className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </label>

          <div className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
            <span>Du kannst Beiträge direkt an Freunde senden.</span>
            <button type="button" aria-label="Hinweis schließen" className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {message && <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">{message}</p>}

          {friends === undefined ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Freunde werden geladen...</p>
          ) : filteredFriends.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Freunde gefunden.</p>
          ) : (
            <div className="grid max-h-[48vh] grid-cols-3 gap-3 overflow-y-auto pb-2 sm:grid-cols-4">
              {filteredFriends.map((entry) => (
                <button
                  key={entry.friendshipId}
                  type="button"
                  className="flex min-h-28 min-w-0 flex-col items-center justify-start rounded-lg px-2 py-3 text-center transition hover:bg-muted/35 disabled:opacity-60"
                  onClick={() => onSend(entry.friend)}
                  disabled={!entry.friend?.username}
                >
                  <Avatar name={entry.friend?.name ?? "?"} avatarUrl={entry.friend?.avatarUrl ?? undefined} size="share" />
                  <p className="mt-2 w-full truncate text-xs font-semibold leading-tight">{entry.friend?.username ?? entry.friend?.name ?? "Unbekannt"}</p>
                  <p className="mt-0.5 w-full truncate text-[0.7rem] leading-tight text-muted-foreground">{entry.friend?.name ?? ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} Tg.`;
  return new Date(timestamp).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "xs" | "sm" | "story" | "feed" | "md" | "lg" | "share" }) {
  const sizeClass =
    size === "lg"
      ? "mx-auto h-20 w-20 text-xl"
      : size === "share"
        ? "h-14 w-14 text-base"
        : size === "story"
          ? "h-full w-full text-base"
          : size === "feed"
            ? "h-12 w-12 text-sm"
            : size === "sm"
              ? "h-9 w-9 text-xs"
              : size === "xs"
                ? "h-5 w-5 text-[0.62rem]"
                : "h-11 w-11";

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-card/65 font-semibold`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "U").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

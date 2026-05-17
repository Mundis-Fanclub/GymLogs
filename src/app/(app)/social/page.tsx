"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  Heart,
  ImagePlus,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Send,
  Share2,
  Trash2,
  Video,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SocialPage() {
  const { userId, isLoaded } = useConvexUser();
  const posts = useQuery(api.social.listFeed, { viewerId: userId, limit: 30 });
  const createPost = useMutation(api.social.createPost);
  const updatePost = useMutation(api.social.updatePost);
  const deletePost = useMutation(api.social.deletePost);
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const toggleLike = useMutation(api.social.toggleLike);
  const toggleCommentLike = useMutation(api.social.toggleCommentLike);
  const addComment = useMutation(api.social.addComment);
  const updateComment = useMutation(api.social.updateComment);
  const deleteComment = useMutation(api.social.deleteComment);
  const shareToUsername = useMutation(api.social.shareToUsername);
  const [body, setBody] = useState("");
  const [mediaStorageId, setMediaStorageId] = useState<Id<"_storage"> | undefined>();
  const [mediaType, setMediaType] = useState<"image" | "video" | undefined>();
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, string>>({});
  const [shareTargets, setShareTargets] = useState<Record<string, string>>({});
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [openReplyCommentId, setOpenReplyCommentId] = useState<string | null>(null);
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostBodies, setEditingPostBodies] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBodies, setEditingCommentBodies] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "post"; id: Id<"social_posts"> }
    | { kind: "comment"; id: Id<"social_comments"> }
    | null
  >(null);

  if (isLoaded && !userId) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Social nur mit Login"
        description="Melde dich an, um Posts zu erstellen, zu liken und zu kommentieren."
        action={
          <Link href="/sign-in">
            <Button>Anmelden</Button>
          </Link>
        }
      />
    );
  }

  async function uploadMedia(file: File | undefined) {
    if (!userId || !file) return;
    setError("");
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!kind) {
      setError("Bitte Bild oder Video auswählen.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("Medien dürfen maximal 30 MB groß sein.");
      return;
    }
    setComposerOpen(true);
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

  async function submitPost() {
    if (!userId) return;
    await createPost({
      authorId: userId,
      body,
      mediaStorageId,
      mediaType,
    });
    setBody("");
    setMediaStorageId(undefined);
    setMediaType(undefined);
    setMediaPreviewUrl("");
    setComposerOpen(false);
  }

  async function confirmDelete() {
    if (!userId || !pendingDelete) return;
    if (pendingDelete.kind === "post") {
      await deletePost({ userId, postId: pendingDelete.id });
      setEditingPostId(null);
    } else {
      await deleteComment({ userId, commentId: pendingDelete.id });
      setEditingCommentId(null);
    }
    setPendingDelete(null);
  }

  const composerExpanded = composerOpen || body.length > 0 || Boolean(mediaStorageId) || Boolean(mediaPreviewUrl);

  function openCommentComposer(postId: Id<"social_posts">) {
    setOpenCommentPostId(postId);
    window.setTimeout(() => {
      document.getElementById(`comment-input-${postId}`)?.focus();
    }, 0);
  }

  const composerForm = (
    <div className="min-w-0 space-y-3">
      {!composerExpanded ? (
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 text-left text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
          onClick={() => setComposerOpen(true)}
        >
          <span>Was gibt es Neues im Training?</span>
          <ChevronDown className="-rotate-90 h-4 w-4" />
        </button>
      ) : (
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Was gibt es Neues im Training?"
          rows={3}
          maxLength={1200}
          autoFocus
          className="min-h-20 resize-none border-0 bg-transparent px-0 py-1 text-[0.95rem] shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      )}
      {mediaPreviewUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          {mediaType === "video" ? (
            <video src={mediaPreviewUrl} controls className="max-h-96 w-full bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaPreviewUrl} alt="" className="max-h-96 w-full object-cover" />
          )}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {composerExpanded && (
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <ImagePlus className="h-4 w-4" />
          <span className="sr-only">{uploading ? "Upload läuft" : "Bild oder Video anhängen"}</span>
          <input type="file" accept="image/*,video/*" className="sr-only" onChange={(event) => uploadMedia(event.target.files?.[0])} />
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setComposerOpen(false);
              setBody("");
              setMediaStorageId(undefined);
              setMediaType(undefined);
              setMediaPreviewUrl("");
              setError("");
            }}
          >
            Abbrechen
          </Button>
          <Button onClick={submitPost} disabled={!userId || uploading || (!body.trim() && !mediaStorageId)}>
            <Send className="h-4 w-4" />
            Posten
          </Button>
        </div>
      </div>
      )}
    </div>
  );

  type FeedPost = NonNullable<typeof posts>[number];
  type FeedComment = FeedPost["comments"][number];

  function renderComment(comment: FeedComment, postId: Id<"social_posts">, isReply = false) {
    const isOwnComment = Boolean(userId && comment.author?._id === userId);
    const isEditingComment = editingCommentId === comment._id;

    return (
      <div key={comment._id} className={`space-y-2 ${isReply ? "pl-5" : ""}`}>
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 text-sm">
          <Avatar name={comment.author?.name ?? "?"} avatarUrl={comment.author?.avatarUrl} size="sm" />
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium leading-5">{comment.author?.name ?? "Unbekannt"}</p>
              {isOwnComment && (
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => setOpenCommentMenuId(openCommentMenuId === comment._id ? null : comment._id)}
                    aria-label="Kommentar-Optionen"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {openCommentMenuId === comment._id && (
                    <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-sm">
                      <button
                        type="button"
                        className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition hover:bg-muted"
                        onClick={() => {
                          setEditingCommentId(comment._id);
                          setEditingCommentBodies({ ...editingCommentBodies, [comment._id]: comment.body });
                          setOpenCommentMenuId(null);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-destructive transition hover:bg-destructive/10"
                        onClick={() => {
                          setPendingDelete({ kind: "comment", id: comment._id });
                          setOpenCommentMenuId(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {isEditingComment ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editingCommentBodies[comment._id] ?? comment.body}
                  onChange={(event) =>
                    setEditingCommentBodies({ ...editingCommentBodies, [comment._id]: event.target.value })
                  }
                  rows={2}
                  maxLength={500}
                  className="min-h-16 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    disabled={!userId || !(editingCommentBodies[comment._id] ?? comment.body).trim()}
                    onClick={() => {
                      if (!userId) return;
                      void updateComment({
                        userId,
                        commentId: comment._id,
                        body: editingCommentBodies[comment._id] ?? comment.body,
                      });
                      setEditingCommentId(null);
                    }}
                  >
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-5 text-muted-foreground">{comment.body}</p>
            )}
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <button
                type="button"
                className={`inline-flex items-center gap-1 transition ${
                  comment.likedByViewer ? "text-rose-500 hover:text-rose-500" : "hover:text-rose-500"
                }`}
                onClick={() => userId && toggleCommentLike({ userId, commentId: comment._id })}
              >
                <Heart className={`h-3.5 w-3.5 ${comment.likedByViewer ? "fill-current" : ""}`} />
                <span>{comment.likeCount}</span>
              </button>
              {!isReply && (
                <button
                  type="button"
                  className="transition hover:text-foreground"
                  onClick={() => setOpenReplyCommentId(openReplyCommentId === comment._id ? null : comment._id)}
                >
                  Antworten
                </button>
              )}
            </div>
          </div>
        </div>

        {comment.replies.length > 0 && (
          <div className="space-y-3 border-l border-border pl-3">
            {comment.replies.map((reply) => renderComment(reply, postId, true))}
          </div>
        )}

        {!isReply && openReplyCommentId === comment._id && (
          <div className="grid gap-2 pl-9 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              placeholder="Auf Kommentar antworten..."
              value={commentReplies[comment._id] ?? ""}
              onChange={(event) => setCommentReplies({ ...commentReplies, [comment._id]: event.target.value })}
            />
            <Button
              variant="outline"
              disabled={!userId || !(commentReplies[comment._id] ?? "").trim()}
              onClick={() => {
                if (!userId) return;
                void addComment({
                  userId,
                  postId,
                  parentCommentId: comment._id,
                  body: commentReplies[comment._id] ?? "",
                });
                setCommentReplies({ ...commentReplies, [comment._id]: "" });
                setOpenReplyCommentId(null);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Senden
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,40rem)_18rem] lg:justify-center">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold leading-none">Social</h1>
        </div>

        <details className="group border-b border-border sm:hidden">
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium sm:hidden [&::-webkit-details-marker]:hidden"
            onClick={() => setComposerOpen(true)}
          >
            <span>Neuen Post erstellen</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <section className="border-t border-border p-3">{composerForm}</section>
        </details>

        <section className="hidden border-b border-border p-3 sm:block">{composerForm}</section>

        <details className="group border-b border-border lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>Post-Ideen</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="space-y-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <p>Text-Updates nach dem Training.</p>
            <p>Bilder vom Workout oder Progress.</p>
            <p>Videos von Top Logs und verified Sets.</p>
          </div>
        </details>

        {posts === undefined ? (
          <p className="border-b border-border p-4 text-sm text-muted-foreground">Feed wird geladen...</p>
        ) : posts.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Noch keine Posts. Starte den Feed mit einem Trainingsupdate, Bild oder Top-Log-Video.
          </div>
        ) : (
          posts.map((post) => {
            const isOwnPost = Boolean(userId && post.author?._id === userId);
            const isEditingPost = editingPostId === post._id;

            return (
            <article key={post._id} className="border-b border-border p-3 transition-colors last:border-b-0 hover:bg-muted/20 sm:p-4">
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
                <Avatar name={post.author?.name ?? "?"} avatarUrl={post.author?.avatarUrl} />
                <div className="min-w-0 space-y-3">
                  <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.95rem] leading-5">
                        <Link href={post.author ? `/profile/${post.author._id}` : "/social"} className="min-w-0 truncate font-semibold hover:underline">
                          {post.author?.username ?? post.author?.name ?? "Unbekannt"}
                        </Link>
                        {post.author?.isPro && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-sky-500 text-background dark:text-card" />
                        )}
                        <span className="text-muted-foreground">·</span>
                        <time className="text-sm text-muted-foreground" title={new Date(post.createdAt).toLocaleString("de-DE")}>
                          {formatRelativeTime(post.createdAt)}
                        </time>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">@{post.author?.name ?? "user"}</p>
                    </div>
                    {isOwnPost && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Post-Optionen"
                          className="-mt-1 text-muted-foreground"
                          onClick={() => setOpenPostMenuId(openPostMenuId === post._id ? null : post._id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openPostMenuId === post._id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-sm">
                            <button
                              type="button"
                              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition hover:bg-muted"
                              onClick={() => {
                                setEditingPostId(post._id);
                                setEditingPostBodies({ ...editingPostBodies, [post._id]: post.body ?? "" });
                                setOpenPostMenuId(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-destructive transition hover:bg-destructive/10"
                              onClick={() => {
                                setPendingDelete({ kind: "post", id: post._id });
                                setOpenPostMenuId(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Löschen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditingPost ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingPostBodies[post._id] ?? post.body ?? ""}
                        onChange={(event) =>
                          setEditingPostBodies({ ...editingPostBodies, [post._id]: event.target.value })
                        }
                        rows={3}
                        maxLength={1200}
                        className="min-h-24 text-[0.95rem]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditingPostId(null)}>
                          Abbrechen
                        </Button>
                        <Button
                          disabled={
                            !userId ||
                            (!(editingPostBodies[post._id] ?? post.body ?? "").trim() &&
                              !post.mediaStorageId &&
                              !post.mediaUrl &&
                              !post.linkedSubmissionId)
                          }
                          onClick={() => {
                            if (!userId) return;
                            void updatePost({
                              userId,
                              postId: post._id,
                              body: editingPostBodies[post._id] ?? post.body ?? "",
                            });
                            setEditingPostId(null);
                          }}
                        >
                          Speichern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    post.body && <p className="whitespace-pre-wrap text-[0.95rem] leading-6">{post.body}</p>
                  )}
                  {post.linkedLog && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                      <Badge className="mb-2 gap-1">
                        <Video className="h-3 w-3" />
                        Top Log
                      </Badge>
                      <p className="font-medium">{post.linkedLog.exerciseName}</p>
                      <p className="text-muted-foreground">
                        {post.linkedLog.weightKg} kg x {post.linkedLog.reps} · Score {post.linkedLog.score ?? "-"}
                      </p>
                    </div>
                  )}
                  {post.mediaUrl && (
                    <div className="overflow-hidden rounded-lg border border-border">
                      {post.mediaType === "video" ? (
                        <video src={post.mediaUrl} controls className="max-h-[32rem] w-full bg-black object-contain" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.mediaUrl} alt="" className="max-h-[32rem] w-full object-cover" />
                      )}
                    </div>
                  )}

                  <div className="hidden max-w-sm items-center justify-between gap-3 text-muted-foreground sm:flex">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm transition hover:text-foreground"
                      onClick={() => openCommentComposer(post._id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentCount}</span>
                    </button>
                    <button type="button" className="inline-flex items-center gap-1.5 text-sm transition hover:text-foreground" aria-label="Repost">
                      <Repeat2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 text-sm transition ${
                        post.likedByViewer ? "text-rose-500 hover:text-rose-500" : "hover:text-rose-500"
                      }`}
                      onClick={() => userId && toggleLike({ userId, postId: post._id })}
                    >
                      <Heart className={`h-4 w-4 ${post.likedByViewer ? "fill-current" : ""}`} />
                      <span>{post.likeCount}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm transition hover:text-foreground"
                      onClick={() => setOpenSharePostId(openSharePostId === post._id ? null : post._id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-muted/20 p-1 sm:hidden">
                    <button
                      type="button"
                      className="flex min-h-10 items-center justify-center gap-1 rounded-md text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => openCommentComposer(post._id)}
                      aria-label="Kommentieren"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex min-h-10 items-center justify-center gap-1 rounded-md text-sm transition hover:bg-muted ${
                        post.likedByViewer ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                      }`}
                      onClick={() => userId && toggleLike({ userId, postId: post._id })}
                      aria-label={post.likedByViewer ? "Like entfernen" : "Liken"}
                      aria-pressed={post.likedByViewer}
                    >
                      <Heart className={`h-4 w-4 ${post.likedByViewer ? "fill-current" : ""}`} />
                      <span>{post.likeCount}</span>
                    </button>
                    <button
                      type="button"
                      className="flex min-h-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Repost"
                    >
                      <Repeat2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="flex min-h-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => setOpenSharePostId(openSharePostId === post._id ? null : post._id)}
                      aria-label="Teilen"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  {post.comments.length > 0 && openCommentPostId !== post._id && (
                    <details className="group rounded-lg border border-border sm:hidden">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                        <span>Kommentare</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
                      </summary>
                      <div className="space-y-3 border-t border-border p-3">
                        {post.comments.map((comment) => renderComment(comment, post._id))}
                      </div>
                    </details>
                  )}

                  {post.comments.length > 0 && openCommentPostId === post._id && (
                    <div className="space-y-3 rounded-lg border border-border p-3 sm:hidden">
                      {post.comments.map((comment) => renderComment(comment, post._id))}
                    </div>
                  )}

                  {post.comments.length > 0 && (
                    <div className="hidden space-y-3 border-t border-border pt-3 sm:block">
                      {post.comments.map((comment) => renderComment(comment, post._id))}
                    </div>
                  )}

                  {openCommentPostId === post._id && (
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Input
                        id={`comment-input-${post._id}`}
                        placeholder="Antwort schreiben..."
                        value={comments[post._id] ?? ""}
                        onChange={(event) => setComments({ ...comments, [post._id]: event.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={!userId || !(comments[post._id] ?? "").trim()}
                        onClick={() => {
                          if (!userId) return;
                          void addComment({ userId, postId: post._id, body: comments[post._id] ?? "" });
                          setComments({ ...comments, [post._id]: "" });
                          setOpenCommentPostId(null);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Senden
                      </Button>
                    </div>
                  )}

                  {openSharePostId === post._id && (
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Input
                        placeholder="An Username schicken"
                        value={shareTargets[post._id] ?? ""}
                        onChange={(event) => setShareTargets({ ...shareTargets, [post._id]: event.target.value })}
                      />
                      <Button
                        variant="outline"
                        disabled={!userId || !(shareTargets[post._id] ?? "").trim()}
                        onClick={() => {
                          if (!userId) return;
                          void shareToUsername({ senderId: userId, postId: post._id, username: shareTargets[post._id] ?? "" });
                          setShareTargets({ ...shareTargets, [post._id]: "" });
                          setOpenSharePostId(null);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        Teilen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </article>
            );
          })
        )}
      </div>

      <aside className="hidden space-y-5 lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post-Ideen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Text-Updates nach dem Training.</p>
            <p>Bilder vom Workout oder Progress.</p>
            <p>Videos von Top Logs und verified Sets.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
    <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
      <DialogContent className="max-w-xs gap-3 rounded-lg p-4" showCloseButton={false}>
        <DialogHeader className="gap-1">
          <DialogTitle className="text-sm">
            {pendingDelete?.kind === "post" ? "Post löschen?" : "Kommentar löschen?"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-4 -mb-4 flex-row justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
            Abbrechen
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void confirmDelete()}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
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

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-11 w-11";

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-semibold`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "U").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

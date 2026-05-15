"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Crown, Heart, ImagePlus, MessageCircle, Send, Share2, Video } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SocialPage() {
  const { userId, isLoaded } = useConvexUser();
  const posts = useQuery(api.social.listFeed, { viewerId: userId, limit: 30 });
  const createPost = useMutation(api.social.createPost);
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const toggleLike = useMutation(api.social.toggleLike);
  const addComment = useMutation(api.social.addComment);
  const shareToUsername = useMutation(api.social.shareToUsername);
  const [body, setBody] = useState("");
  const [mediaStorageId, setMediaStorageId] = useState<Id<"_storage"> | undefined>();
  const [mediaType, setMediaType] = useState<"image" | "video" | undefined>();
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [shareTargets, setShareTargets] = useState<Record<string, string>>({});

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
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Social-Feed</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posts für Texte, Bilder und Top-Log-Videos. Aktuell ist der Feed leer, bis jemand etwas postet.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Was gibt es Neues im Training?"
              rows={4}
              maxLength={1200}
            />
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
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Upload..." : "Bild/Video"}
                <input type="file" accept="image/*,video/*" className="sr-only" onChange={(event) => uploadMedia(event.target.files?.[0])} />
              </label>
              <Button onClick={submitPost} disabled={!userId || (!body.trim() && !mediaStorageId)}>
                <Send className="h-4 w-4" />
                Posten
              </Button>
            </div>
          </CardContent>
        </Card>

        {posts === undefined ? (
          <p className="text-sm text-muted-foreground">Feed wird geladen...</p>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
              Noch keine Posts. Starte den Feed mit einem Trainingsupdate, Bild oder Top-Log-Video.
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post._id}>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={post.author?.name ?? "?"} avatarUrl={post.author?.avatarUrl} />
                  <div className="min-w-0">
                    <Link href={post.author ? `/profile/${post.author._id}` : "/social"} className="flex items-center gap-1 font-medium hover:underline">
                      {post.author?.name ?? "Unbekannt"}
                      {post.author?.isPro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{post.author?.username ?? "user"} · {new Date(post.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                </div>

                {post.body && <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>}
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

                <div className="flex flex-wrap gap-2">
                  <Button variant={post.likedByViewer ? "default" : "outline"} size="sm" onClick={() => userId && toggleLike({ userId, postId: post._id })}>
                    <Heart className="h-3.5 w-3.5" />
                    {post.likeCount}
                  </Button>
                  <Badge variant="outline">{post.commentCount} Kommentare</Badge>
                </div>

                <div className="space-y-2">
                  {post.comments.map((comment) => (
                    <div key={comment._id} className="rounded-lg bg-muted/30 p-3 text-sm">
                      <p className="font-medium">{comment.author?.name ?? "Unbekannt"}</p>
                      <p className="text-muted-foreground">{comment.body}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    placeholder="Kommentieren..."
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
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Senden
                  </Button>
                </div>

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
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Teilen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <aside className="space-y-5">
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
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-semibold">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "U").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

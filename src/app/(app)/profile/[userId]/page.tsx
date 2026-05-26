"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import {
  Ban,
  Calendar,
  Crown,
  Dumbbell,
  Flag,
  Heart,
  Bookmark,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
  Send,
  Share2,
  Sparkles,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { ProfilePageIsland } from "@/components/profile/ProfilePageIsland";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ACCENTS = {
  emerald: "from-emerald-500 via-sky-500 to-slate-950",
  sky: "from-sky-500 via-cyan-400 to-slate-950",
  rose: "from-rose-500 via-orange-400 to-slate-950",
  amber: "from-amber-400 via-lime-500 to-slate-950",
  violet: "from-violet-500 via-fuchsia-400 to-slate-950",
} as const;

type ProfileTopLog = {
  submission: {
    _id: Id<"log_submissions">;
    liftType: "bench_press" | "squat" | "deadlift";
    weightKg: number;
    reps: number;
    score?: number;
    bodyweightClass: string;
    submittedAt: number;
  };
  exerciseName: string;
  rank: number | null;
  total: number;
  percentile: number | null;
  isTopFivePercent: boolean;
};

type ProfileWorkoutTemplate = {
  _id: Id<"workout_templates">;
  name: string;
  visibility: "private" | "friends" | "public";
  showWeights: boolean;
  description?: string;
  totalExercises: number;
  totalSets: number;
  totalVolume: number | null;
  exercises: Array<{
    exerciseName: string;
    muscleGroup: string;
    category: string;
    sets: Array<{ reps: number; weight: number | null }>;
  }>;
};

type ProfilePost = {
  _id: Id<"social_posts">;
  body: string;
  createdAt: number;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "gif";
  likedByViewer: boolean;
  savedByViewer: boolean;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  linkedLog: null | {
    exerciseName: string | null;
    weightKg: number;
    reps: number;
    score?: number;
  };
};

const LIFT_LABELS = {
  bench_press: "Bench Press",
  squat: "Squat",
  deadlift: "Deadlift",
} as const;

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const viewedUserId = params.userId as Id<"users">;
  const { userId } = useConvexUser();
  if (userId === viewedUserId) {
    return <ProfilePageIsland />;
  }
  return <PublicProfileContent viewedUserId={viewedUserId} userId={userId} />;
}

function PublicProfileContent({
  viewedUserId,
  userId,
}: {
  viewedUserId: Id<"users">;
  userId: Id<"users"> | null | undefined;
}) {
  const profile = useQuery(api.users.getPublicProfile, {
    userId: viewedUserId,
    ...(userId ? { viewerId: userId } : {}),
  });
  const topLogs = useQuery(api.logs.getProfileTopLogs, {
    userId: viewedUserId,
    ...(userId ? { viewerId: userId } : {}),
    limit: 5,
  });
  const workoutTemplates = useQuery(api.workouts.listProfileTemplates, {
    userId: viewedUserId,
    ...(userId ? { viewerId: userId } : {}),
    limit: 12,
  });
  const posts = useQuery(api.social.listByAuthor, {
    authorId: viewedUserId,
    ...(userId ? { viewerId: userId } : {}),
    limit: 30,
  });
  const sendMessage = useMutation(api.messages.send);
  const togglePostLike = useMutation(api.social.toggleLike);
  const togglePostSave = useMutation(api.social.toggleSave);
  const addProfilePostComment = useMutation(api.social.addComment);
  const friends = useQuery(api.friends.list, userId ? { userId } : "skip");
  const addFriend = useMutation(api.friends.addByUsername);
  const removeFriend = useMutation(api.friends.remove);
  const blockUser = useMutation(api.messages.blockUser);
  const reportUser = useMutation(api.messages.reportUser);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [reportReason, setReportReason] = useState("Profil wirkt wie Spam");
  const [showReport, setShowReport] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  async function submit() {
    if (!userId || !body.trim()) return;
    await sendMessage({ senderId: userId, recipientId: viewedUserId, body });
    setBody("");
    setSent(true);
    setShowMessageComposer(false);
    window.setTimeout(() => setSent(false), 2200);
  }

  async function submitProfileReport() {
    if (!userId) return;
    await reportUser({
      reporterId: userId,
      reportedUserId: viewedUserId,
      reason: reportReason,
    });
    setShowReport(false);
  }

  async function submitProfilePostComment(postId: Id<"social_posts">) {
    if (!userId) return;
    const commentBody = commentBodies[postId]?.trim();
    if (!commentBody) return;
    await addProfilePostComment({ userId, postId, body: commentBody });
    setCommentBodies((current) => ({ ...current, [postId]: "" }));
    setActiveCommentPostId(null);
  }

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">Profil wird geladen...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Profil nicht gefunden.</p>;
  }

  const isSelf = userId === viewedUserId;
  const friendship = friends?.find((entry) => entry.friend?._id === viewedUserId);
  const accent = ACCENTS[(profile.profileAccent ?? "emerald") as keyof typeof ACCENTS] ?? ACCENTS.emerald;
  const canAddFriend = Boolean(userId && !isSelf && profile.username);
  const canMessage = Boolean(userId && !isSelf && profile.allowMessages);
  const visibleMetrics = [
    profile.heightCm ? { icon: Ruler, label: "Größe", value: `${profile.heightCm} cm` } : null,
    profile.weightKg ? { icon: Scale, label: "Gewicht", value: `${profile.weightKg} kg` } : null,
    profile.birthDate
      ? {
          icon: Calendar,
          label: "Geburtsdatum",
          value: new Date(profile.birthDate).toLocaleDateString("de-DE"),
        }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Ruler; label: string; value: string }>;

  return (
    <div className="mx-auto max-w-5xl space-y-5 overflow-x-hidden">
      <Card className="overflow-hidden">
        <div
          className={`relative min-h-[23rem] bg-gradient-to-br bg-cover bg-center sm:min-h-52 ${accent}`}
          style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})` } : undefined}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute bottom-4 left-4 right-4 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <Avatar name={profile.name} avatarUrl={profile.avatarUrl} />
              <div className="min-w-0 text-white">
                <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold sm:text-3xl">
                  <span className="truncate">{profile.name}</span>
                  {profile.isPro && <Crown className="h-6 w-6 shrink-0 text-amber-300" />}
                </h1>
                <p className="truncate text-sm text-white/80">@{profile.username ?? "user"}</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {canMessage && (
                <Button className="w-full sm:w-auto" onClick={() => setShowMessageComposer((value) => !value)}>
                  <MessageCircle className="h-4 w-4" />
                  Nachricht senden
                </Button>
              )}
              {canAddFriend && (
                <Button
                  className="w-full sm:w-auto"
                  variant={friendship ? "secondary" : "outline"}
                  onClick={() => {
                    if (!userId || !profile.username) return;
                    return friendship
                      ? removeFriend({ userId, friendId: viewedUserId })
                      : addFriend({ userId, username: profile.username });
                  }}
                >
                  <User className="h-4 w-4" />
                  {friendship ? "Befreundet" : "Freund hinzufügen"}
                </Button>
              )}
              {userId && !isSelf && profile.isPublic !== false && (
                <>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => blockUser({ blockerId: userId, blockedId: viewedUserId })}>
                    <Ban className="h-4 w-4" />
                    Blockieren
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => setShowReport((value) => !value)}>
                    <Flag className="h-4 w-4" />
                    Melden
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {profile.isPublic !== false && (
          <CardContent className="space-y-5 p-4 sm:p-6">
            <>
              <div className="flex min-w-0 flex-wrap gap-2">
                {profile.location && <Badge variant="secondary"><MapPin className="h-3 w-3" />{profile.location}</Badge>}
                {profile.favoriteLift && <Badge variant="secondary"><Dumbbell className="h-3 w-3" />{profile.favoriteLift}</Badge>}
                {profile.isPro && <Badge className="gap-1 bg-amber-500 text-black"><Crown className="h-3 w-3" />Pro</Badge>}
                {topLogs?.some((log) => log.isTopFivePercent) && <Badge className="gap-1"><Sparkles className="h-3 w-3" />Top 5%</Badge>}
                {profile.trainingSummary?.completedWorkouts ? <Badge><Trophy className="h-3 w-3" />Aktiv</Badge> : <Badge variant="outline">Neu</Badge>}
              </div>

              {profile.bio && <p className="text-sm leading-6">{profile.bio}</p>}
              {profile.trainingGoal && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-medium"><Target className="h-4 w-4" />Trainingsziel</p>
                  <p className="text-muted-foreground">{profile.trainingGoal}</p>
                </div>
              )}

              {visibleMetrics.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {visibleMetrics.map((metric) => (
                    <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
                  ))}
                </div>
              )}

              {profile.trainingSummary ? (
                <div className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
                  <Metric icon={Sparkles} label="Workouts" value={String(profile.trainingSummary.completedWorkouts)} />
                  <Metric icon={Dumbbell} label="Sets" value={String(profile.trainingSummary.totalSets)} />
                  <Metric icon={Trophy} label="Volumen" value={`${Math.round(profile.trainingSummary.totalVolume).toLocaleString("de-DE")} kg`} />
                  <Metric icon={Calendar} label="Frequenz" value={`${profile.trainingSummary.averageWorkoutsPerWeek}/Woche`} />
                </div>
              ) : null}

              {profile.trainingSummary?.bestSet && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="mb-1 text-sm font-medium">Stärkstes öffentliches Set</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.trainingSummary.bestSet.exerciseName}: {profile.trainingSummary.bestSet.weight} kg x {profile.trainingSummary.bestSet.reps}
                  </p>
                </div>
              )}

              <TopLogsPanel logs={topLogs} />

              <WorkoutTemplatesPanel templates={workoutTemplates} />
            </>
          </CardContent>
        )}
      </Card>

      {sent && <p className="px-1 text-sm text-emerald-500">Nachricht gesendet.</p>}

      {showMessageComposer && canMessage && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              Nachricht senden
            </div>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={600} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" onClick={submit} disabled={!body.trim()}>
                <Send className="h-4 w-4" />
                Senden
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowMessageComposer(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showReport && userId && !isSelf && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <Label>Meldegrund</Label>
            <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
            <p className="text-xs text-muted-foreground">
              Profilmeldungen landen in der Moderationsqueue. Nachrichten lassen sich direkt in Unterhaltungen melden.
            </p>
            <Button variant="destructive" onClick={submitProfileReport}>
              Profil melden
            </Button>
          </CardContent>
        </Card>
      )}

      {!userId && !isSelf && profile.isPublic !== false && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            Melde dich an, um Nachrichten zu schreiben.
          </CardContent>
        </Card>
      )}

      {profile.isPublic !== false && (
        <ProfilePostsPanel
          posts={posts}
          userId={userId}
          commentBodies={commentBodies}
          activeCommentPostId={activeCommentPostId}
          onLike={(postId) => userId && togglePostLike({ userId, postId })}
          onSave={(postId) => userId && togglePostSave({ userId, postId })}
          onToggleComment={(postId) =>
            setActiveCommentPostId((current) => current === postId ? null : postId)
          }
          onCommentBodyChange={(postId, body) =>
            setCommentBodies((current) => ({ ...current, [postId]: body }))
          }
          onSubmitComment={submitProfilePostComment}
        />
      )}
    </div>
  );
}

function TopLogsPanel({ logs }: { logs: ProfileTopLog[] | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4" />
          Top Logs
        </p>
        {logs?.some((log) => log.isTopFivePercent) && (
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            Top 5%
          </Badge>
        )}
      </div>
      {logs === undefined ? (
        <p className="text-sm text-muted-foreground">Top Logs werden geladen...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine verified Top Logs sichtbar.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.submission._id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{log.exerciseName || LIFT_LABELS[log.submission.liftType]}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.submission.weightKg} kg x {log.submission.reps} · Score {log.submission.score ?? "-"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {log.rank && (
                    <Badge variant="secondary">
                      #{log.rank} von {log.total}
                    </Badge>
                  )}
                  {log.percentile && <Badge variant="outline">{log.percentile}%</Badge>}
                  {log.isTopFivePercent && (
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Top 5%
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {LIFT_LABELS[log.submission.liftType]} · {log.submission.bodyweightClass} ·{" "}
                {new Date(log.submission.submittedAt).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutTemplatesPanel({
  templates,
}: {
  templates: ProfileWorkoutTemplate[] | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Dumbbell className="h-4 w-4" />
          Workout-Playlists
        </p>
      </div>
      {templates === undefined ? (
        <p className="text-sm text-muted-foreground">Workout-Playlists werden geladen...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine sichtbaren Workout-Playlists.</p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template._id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{template.name}</p>
                  {template.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.totalExercises} Übungen · {template.totalSets} Sets
                    {template.totalVolume !== null
                      ? ` · ${Math.round(template.totalVolume).toLocaleString("de-DE")} kg`
                      : " · Gewichte verborgen"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={template.visibility === "public" ? "default" : "outline"}>
                    {template.visibility === "public" ? "Öffentlich" : "Nur Freunde"}
                  </Badge>
                  <Badge variant="secondary">
                    {template.showWeights ? "Mit Gewichten" : "Ohne Gewichte"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {template.exercises.slice(0, 4).map((exercise) => (
                  <div key={`${template._id}-${exercise.exerciseName}`} className="rounded-lg bg-muted/30 p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{exercise.exerciseName}</span>
                      <span className="text-xs text-muted-foreground">{exercise.sets.length} Sets</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exercise.sets
                        .slice(0, 4)
                        .map((set) =>
                          set.weight === null ? `${set.reps} Wdh.` : `${set.weight} kg x ${set.reps}`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfilePostsPanel({
  posts,
  userId,
  commentBodies,
  activeCommentPostId,
  onLike,
  onSave,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
}: {
  posts: ProfilePost[] | undefined;
  userId: Id<"users"> | null | undefined;
  commentBodies: Record<string, string>;
  activeCommentPostId: string | null;
  onLike: (postId: Id<"social_posts">) => void;
  onSave: (postId: Id<"social_posts">) => void;
  onToggleComment: (postId: Id<"social_posts">) => void;
  onCommentBodyChange: (postId: Id<"social_posts">, body: string) => void;
  onSubmitComment: (postId: Id<"social_posts">) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="border-b border-border pb-3">
        <p className="text-sm font-medium">Beiträge</p>
        <p className="text-xs text-muted-foreground">Neueste zuerst</p>
      </div>
      {posts === undefined ? (
        <p className="text-sm text-muted-foreground">Beiträge werden geladen...</p>
      ) : posts.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/20 p-6 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Noch keine Beiträge</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Wenn Beiträge geteilt werden, erscheinen sie hier.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {posts.map((post) => {
            const commentBody = commentBodies[post._id] ?? "";
            const showCommentInput = activeCommentPostId === post._id;
            return (
            <article key={post._id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <time title={new Date(post.createdAt).toLocaleString("de-DE")}>
                  {new Date(post.createdAt).toLocaleDateString("de-DE")}
                </time>
                <div className="flex items-center gap-4">
                  <span>{post.likeCount} Likes</span>
                  <span>{post.commentCount} Kommentare</span>
                </div>
              </div>
              {post.body && <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>}
              {post.linkedLog && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{post.linkedLog.exerciseName ?? "Top Log"}</p>
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
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:flex sm:items-center sm:gap-5">
                <button type="button" disabled={!userId} onClick={() => onLike(post._id)} className={`inline-flex items-center gap-1 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 ${post.likedByViewer ? "text-rose-500 hover:text-rose-500" : ""}`}>
                  <Heart className={`h-4 w-4 ${post.likedByViewer ? "fill-current" : ""}`} />
                  {post.likeCount}
                </button>
                <button type="button" disabled={!userId} onClick={() => onToggleComment(post._id)} className="inline-flex items-center gap-1 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60">
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount}
                </button>
                <button type="button" disabled={!userId} onClick={() => onSave(post._id)} className={`inline-flex items-center gap-1 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 ${post.savedByViewer ? "text-cyan-500 hover:text-cyan-500" : ""}`}>
                  <Bookmark className={`h-4 w-4 ${post.savedByViewer ? "fill-current" : ""}`} />
                  Speichern
                </button>
                <span className="inline-flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Teilen
                </span>
              </div>
              {showCommentInput && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={commentBody}
                    onChange={(event) => onCommentBodyChange(post._id, event.target.value)}
                    placeholder="Kommentieren..."
                    maxLength={500}
                  />
                  <Button size="sm" disabled={!commentBody.trim()} onClick={() => onSubmitComment(post._id)}>
                    Senden
                  </Button>
                </div>
              )}
            </article>
          );
          })}
        </div>
      )}
    </section>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted text-2xl font-semibold sm:h-24 sm:w-24 sm:text-3xl">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "U").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="font-medium">{value}</p>
    </div>
  );
}

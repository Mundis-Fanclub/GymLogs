"use client";

import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ban,
  Calendar,
  ChevronDown,
  Crown,
  Dumbbell,
  Flag,
  Heart,
  Bookmark,
  MapPin,
  MessageCircle,
  Play,
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
import { FollowDialog } from "@/components/profile/FollowDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

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
  executionCount: number;
  exercises: Array<{
    exerciseName: string;
    muscleGroup: string;
    category: string;
    sets: Array<{ reps: number; weight: number | null }>;
  }>;
};

type ProfilePostComment = {
  _id: Id<"social_comments">;
  body: string;
  createdAt: number;
  updatedAt?: number;
  author: null | {
    _id: Id<"users">;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    isPro: boolean;
  };
  mediaUrl?: string | null;
  mediaType?: "gif";
  likeCount: number;
  likedByViewer: boolean;
  replies?: ProfilePostComment[];
};

type ProfilePost = {
  _id: Id<"social_posts">;
  body: string;
  createdAt: number;
  updatedAt?: number;
  repostOfPostId?: Id<"social_posts">;
  repostOf?: unknown | null;
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
  comments?: ProfilePostComment[];
};

type PublicProfileTab = "posts" | "reposts" | "media" | "logs" | "training";

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
  const router = useRouter();
  const { locale, t } = useAppPreferences();
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
  const followGraph = useQuery(api.follows.listForProfile, {
    userId: viewedUserId,
    ...(userId ? { viewerId: userId } : {}),
    limit: 80,
  });
  const sendMessage = useMutation(api.messages.send);
  const togglePostLike = useMutation(api.social.toggleLike);
  const togglePostSave = useMutation(api.social.toggleSave);
  const addProfilePostComment = useMutation(api.social.addComment);
  const followUser = useMutation(api.follows.follow);
  const unfollowUser = useMutation(api.follows.unfollow);
  const blockUser = useMutation(api.messages.blockUser);
  const reportUser = useMutation(api.messages.reportUser);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [reportReason, setReportReason] = useState(t("profile.public.reportDefault"));
  const [showReport, setShowReport] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [activePublicTab, setActivePublicTab] = useState<PublicProfileTab>("posts");
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const mediaPosts = useMemo(() => posts?.filter((post) => Boolean(post.mediaUrl)), [posts]);
  const repostPosts = useMemo(
    () => posts?.filter((post) => Boolean(post.repostOfPostId || post.repostOf)),
    [posts]
  );

  function openDirectMessage() {
    if (!userId) return;
    window.sessionStorage.setItem("gymlogs:pending-message-user", viewedUserId);
    router.push("/profile#messages");
  }

  async function submit() {
    if (!userId || !body.trim()) return;
    await sendMessage({ senderId: userId, recipientId: viewedUserId, body });
    setBody("");
    setSent(true);
    setShowMessageComposer(false);
    router.push("/profile#messages");
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

  function toggleFollowProfile() {
    if (!userId) return;
    if (followGraph?.viewerFollowing) {
      void unfollowUser({ followerId: userId, followingId: viewedUserId });
    } else {
      void followUser({ followerId: userId, followingId: viewedUserId });
    }
  }

  function toggleFollowInDialog(targetId: Id<"users">, following: boolean) {
    if (!userId) return;
    if (following) {
      void unfollowUser({ followerId: userId, followingId: targetId });
    } else {
      void followUser({ followerId: userId, followingId: targetId });
    }
  }

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">{t("profile.public.loading")}</p>;
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">{t("profile.public.notFound")}</p>;
  }

  const isSelf = userId === viewedUserId;
  const canFollow = Boolean(userId && !isSelf);
  const canMessage = Boolean(userId && !isSelf && profile.allowMessages);
  const publicFields = (profile.publicFields ?? {}) as {
    trainingSummary?: boolean;
    trainingStreak?: boolean;
    trainingBestSet?: boolean;
    trainingActivity?: boolean;
    trainingVolume?: boolean;
  };
  const showTrainingStreak = publicFields.trainingStreak ?? publicFields.trainingSummary ?? true;
  const showTrainingBestSet = publicFields.trainingBestSet ?? publicFields.trainingSummary ?? true;
  const showTrainingActivity = publicFields.trainingActivity ?? publicFields.trainingSummary ?? true;
  const showTrainingVolume = publicFields.trainingVolume ?? publicFields.trainingSummary ?? true;
  const hasVisibleTrainingMetric =
    showTrainingStreak ||
    (showTrainingBestSet && Boolean(profile.trainingSummary?.bestSet)) ||
    showTrainingActivity ||
    showTrainingVolume;
  const visibleMetrics = [
    profile.heightCm ? { icon: Ruler, label: t("profile.fields.heightCm"), value: `${profile.heightCm} cm` } : null,
    profile.weightKg ? { icon: Scale, label: t("profile.fields.weightKg"), value: `${profile.weightKg} kg` } : null,
    profile.birthDate
      ? {
          icon: Calendar,
          label: t("profile.fields.birthDate"),
          value: new Date(profile.birthDate).toLocaleDateString(locale),
        }
      : null,
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; label: string; value: string }>;
  const trainingMetricItems = [
    showTrainingStreak && profile.trainingSummary
      ? { icon: Sparkles, label: t("profile.metrics.streak"), value: `${profile.trainingSummary.currentStreakDays} ${t("profile.public.days")}` }
      : null,
    showTrainingBestSet && profile.trainingSummary?.bestSet
      ? { icon: Dumbbell, label: t("profile.metrics.topLift"), value: `${profile.trainingSummary.bestSet.weight} kg x ${profile.trainingSummary.bestSet.reps}` }
      : null,
    showTrainingActivity && profile.trainingSummary
      ? { icon: Calendar, label: t("profile.metrics.activity"), value: `${profile.trainingSummary.averageWorkoutsPerWeek}/${t("profile.metrics.week")}` }
      : null,
    showTrainingVolume && profile.trainingSummary
      ? { icon: Trophy, label: t("profile.metrics.volume30"), value: `${Math.round(profile.trainingSummary.totalVolume).toLocaleString(locale)} kg` }
      : null,
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; label: string; value: string }>;
  const publicProfileTabs: Array<{ id: PublicProfileTab; label: string }> = [
    { id: "posts", label: t("profile.tabs.posts") },
    { id: "reposts", label: t("profile.tabs.reposts") },
    { id: "media", label: t("profile.tabs.media") },
    { id: "logs", label: t("profile.tabs.logs") },
    { id: "training", label: t("profile.tabs.training") },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 overflow-x-hidden">
      <Card className="overflow-hidden">
        <div
          className="relative min-h-[23rem] bg-muted bg-cover bg-center sm:min-h-52"
          style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/35 to-background/85" />
          <div className="absolute bottom-4 left-4 right-4 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <Avatar name={profile.name} avatarUrl={profile.avatarUrl} />
              <div className="min-w-0 text-foreground">
                <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold sm:text-3xl">
                  <span className="truncate">{profile.name}</span>
                  {profile.isPro && <Crown className="h-6 w-6 shrink-0 text-amber-300" />}
                </h1>
                <p className="truncate text-sm text-muted-foreground">@{profile.username ?? "user"}</p>
                <button
                  type="button"
                  className="mt-2 text-left text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  onClick={() => setFollowDialogOpen(true)}
                >
                  {(followGraph?.followerCount ?? 0).toLocaleString(locale)} {t("profile.follow.followerLine")}
                </button>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:min-w-[22rem] sm:flex-wrap sm:justify-end">
              {canMessage && (
                <Button className="h-10 w-full rounded-full sm:w-auto sm:min-w-40" onClick={openDirectMessage}>
                  <MessageCircle className="h-4 w-4" />
                  {t("profile.public.sendMessage")}
                </Button>
              )}
              {canFollow && (
                <Button
                  className="h-10 w-full rounded-full sm:w-auto sm:min-w-36"
                  variant={followGraph?.viewerFollowing ? "secondary" : "outline"}
                  onClick={toggleFollowProfile}
                >
                  <User className="h-4 w-4" />
                  {followGraph?.viewerFollowing ? t("profile.follow.following") : t("profile.follow.follow")}
                </Button>
              )}
              {userId && !isSelf && profile.isPublic !== false && (
                <>
                  <Button className="h-10 w-full rounded-full sm:w-auto" variant="outline" onClick={() => blockUser({ blockerId: userId, blockedId: viewedUserId })}>
                    <Ban className="h-4 w-4" />{t("profile.public.block")}</Button>
                  <Button className="h-10 w-full rounded-full sm:w-auto" variant="outline" onClick={() => setShowReport((value) => !value)}>
                    <Flag className="h-4 w-4" />{t("profile.public.report")}</Button>
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
                {profile.trainingSummary?.completedWorkouts ? <Badge><Trophy className="h-3 w-3" />{t("profile.public.active")}</Badge> : <Badge variant="outline">{t("profile.public.new")}</Badge>}
              </div>

              {profile.bio && <p className="text-sm leading-6">{profile.bio}</p>}
              {profile.trainingGoal && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-medium"><Target className="h-4 w-4" />{t("profile.fields.trainingGoal")}</p>
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

              {profile.trainingSummary && hasVisibleTrainingMetric ? (
                <div className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
                  {trainingMetricItems.map((metric) => (
                    <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
                  ))}
                </div>
              ) : null}

              {showTrainingBestSet && profile.trainingSummary?.bestSet && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="mb-1 text-sm font-medium">{t("profile.public.bestPublicSet")}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.trainingSummary.bestSet.exerciseName}: {profile.trainingSummary.bestSet.weight} kg x {profile.trainingSummary.bestSet.reps}
                  </p>
                </div>
              )}
            </>
          </CardContent>
        )}
      </Card>

      {sent && <p className="px-1 text-sm text-emerald-500">{t("profile.public.messageSent")}</p>}

      {showMessageComposer && canMessage && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              {t("profile.public.sendMessage")}
            </div>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={600} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" onClick={submit} disabled={!body.trim()}>
                <Send className="h-4 w-4" />
                {t("profile.networkPanel.send")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowMessageComposer(false)}>
                {t("profile.misc.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showReport && userId && !isSelf && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <Label>{t("profile.public.reportReason")}</Label>
            <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
            <p className="text-xs text-muted-foreground">
              {t("profile.public.reportCopy")}
            </p>
            <Button variant="destructive" onClick={submitProfileReport}>
              {t("profile.public.reportProfile")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!userId && !isSelf && profile.isPublic !== false && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {t("profile.public.signInToMessage")}
          </CardContent>
        </Card>
      )}

      {profile.isPublic !== false && (
        <>
          <div className="border-b border-border">
            <div className="flex gap-4 overflow-x-auto sm:gap-5">
              {publicProfileTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={activePublicTab === tab.id}
                  className={`relative min-h-11 px-1 text-base font-semibold transition-colors sm:min-h-12 sm:text-lg ${
                    activePublicTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActivePublicTab(tab.id)}
                >
                  {tab.label}
                  {activePublicTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
          {activePublicTab === "logs" ? (
            <TopLogsPanel logs={topLogs} />
          ) : activePublicTab === "training" ? (
            <PublicTrainingPanel
              trainingGoal={profile.trainingGoal}
              visibleMetrics={visibleMetrics}
              trainingMetrics={trainingMetricItems}
              templates={workoutTemplates}
            />
          ) : (
            <ProfilePostsPanel
              title={
                activePublicTab === "media"
                  ? t("profile.tabs.media")
                  : activePublicTab === "reposts"
                    ? t("profile.tabs.reposts")
                    : t("profile.public.postsTitle")
              }
              posts={
                activePublicTab === "media"
                  ? mediaPosts
                  : activePublicTab === "reposts"
                    ? repostPosts
                    : posts
              }
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
              emptyTitle={
                activePublicTab === "media"
                  ? t("profile.public.mediaEmptyTitle")
                  : activePublicTab === "reposts"
                    ? t("profile.public.repostsEmptyTitle")
                    : undefined
              }
            />
          )}
        </>
      )}
      <FollowDialog
        open={followDialogOpen}
        onOpenChange={setFollowDialogOpen}
        graph={followGraph}
        viewerId={userId}
        profileUserId={viewedUserId}
        onFollowToggle={toggleFollowInDialog}
      />
    </div>
  );
}

function PublicTrainingPanel({
  trainingGoal,
  visibleMetrics,
  trainingMetrics,
  templates,
}: {
  trainingGoal?: string;
  visibleMetrics: Array<{ icon: ComponentType<{ className?: string }>; label: string; value: string }>;
  trainingMetrics: Array<{ icon: ComponentType<{ className?: string }>; label: string; value: string }>;
  templates: ProfileWorkoutTemplate[] | undefined;
}) {
  const { t } = useAppPreferences();
  const hasTrainingInfo = Boolean(trainingGoal) || visibleMetrics.length > 0 || trainingMetrics.length > 0;

  return (
    <section className="space-y-4">
      {hasTrainingInfo ? (
        <>
          {trainingGoal && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <Target className="h-4 w-4" />
                {t("profile.fields.trainingGoal")}
              </p>
              <p className="text-muted-foreground">{trainingGoal}</p>
            </div>
          )}
          {visibleMetrics.length > 0 && (
            <div className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3">
              {visibleMetrics.map((metric) => (
                <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
              ))}
            </div>
          )}
          {trainingMetrics.length > 0 && (
            <div className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
              {trainingMetrics.map((metric) => (
                <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          {t("profile.training.emptyPublic")}
        </div>
      )}
      <WorkoutTemplatesPanel templates={templates} />
    </section>
  );
}

function TopLogsPanel({ logs }: { logs: ProfileTopLog[] | undefined }) {
  const { locale, t } = useAppPreferences();

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4" />
          {t("profile.tabs.logs")}
        </p>
        {logs?.some((log) => log.isTopFivePercent) && (
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            Top 5%
          </Badge>
        )}
      </div>
      {logs === undefined ? (
        <p className="text-sm text-muted-foreground">{t("profile.topLogs.loading")}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("profile.topLogs.empty")}</p>
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
                      #{log.rank} {t("profile.topLogs.of")} {log.total}
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
                {new Date(log.submission.submittedAt).toLocaleDateString(locale)}
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
  const { locale, t } = useAppPreferences();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Dumbbell className="h-4 w-4" />
          {t("profile.playlists.title")}
        </p>
      </div>
      {templates === undefined ? (
        <p className="text-sm text-muted-foreground">{t("profile.playlists.loading")}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("profile.playlists.emptyPublic")}</p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const isExpanded = expandedTemplateId === template._id;
            return (
            <div key={template._id} className="rounded-lg border border-border bg-background p-3 transition hover:border-primary/30 hover:bg-muted/20">
              <button
                type="button"
                className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between"
                onClick={() => setExpandedTemplateId((current) => current === template._id ? null : template._id)}
                aria-expanded={isExpanded}
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  {template.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.totalExercises} {t("profile.playlists.exercises")} · {template.totalSets} Sets
                    {template.totalVolume !== null
                      ? ` · ${Math.round(template.totalVolume).toLocaleString(locale)} kg`
                      : ` · ${t("profile.playlists.weightsHidden")}`}
                    {" · "}
                    {template.executionCount} {t("profile.playlists.performedCount")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={template.visibility === "public" ? "default" : "outline"}>
                    {template.visibility === "public" ? t("profile.playlists.public") : t("profile.playlists.friends")}
                  </Badge>
                  <Badge variant="secondary">
                    {template.showWeights ? t("profile.playlists.withWeights") : t("profile.playlists.withoutWeights")}
                  </Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExpanded && (
              <div className="mt-3 grid gap-3 border-t border-border pt-3">
                <Link href={`/workouts/new?templateId=${template._id}`} className="inline-flex">
                  <Button className="gap-2">
                    <Play className="h-4 w-4" />
                    {t("profile.playlists.startWorkout")}
                  </Button>
                </Link>
                <div className="grid gap-2">
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
                          set.weight === null ? `${set.reps} ${t("profile.playlists.repsShort")}` : `${set.weight} kg x ${set.reps}`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                ))}
                </div>
              </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

function ProfilePostsPanel({
  title,
  posts,
  userId,
  commentBodies,
  activeCommentPostId,
  emptyTitle,
  onLike,
  onSave,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
}: {
  title?: string;
  posts: ProfilePost[] | undefined;
  userId: Id<"users"> | null | undefined;
  commentBodies: Record<string, string>;
  activeCommentPostId: string | null;
  emptyTitle?: string;
  onLike: (postId: Id<"social_posts">) => void;
  onSave: (postId: Id<"social_posts">) => void;
  onToggleComment: (postId: Id<"social_posts">) => void;
  onCommentBodyChange: (postId: Id<"social_posts">, body: string) => void;
  onSubmitComment: (postId: Id<"social_posts">) => void;
}) {
  const { locale, t } = useAppPreferences();
  async function sharePost(postId: Id<"social_posts">) {
    const postUrl = `${window.location.origin}/social?post=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("profile.public.sharePost"),
          url: postUrl,
        });
        return;
      }
      await navigator.clipboard?.writeText(postUrl);
    } catch {
      // Closing the native share sheet should not break the post UI.
    }
  }

  return (
    <section className="space-y-3">
      <div className="border-b border-border pb-3">
        <p className="text-sm font-medium">{title ?? t("profile.public.postsTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("profile.public.newestFirst")}</p>
      </div>
      {posts === undefined ? (
        <p className="text-sm text-muted-foreground">{t("profile.public.postsLoading")}</p>
      ) : posts.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/20 p-6 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{emptyTitle ?? t("profile.public.postsEmptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("profile.public.postsEmptyCopy")}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {posts.map((post) => {
            const commentBody = commentBodies[post._id] ?? "";
            const showCommentInput = activeCommentPostId === post._id;
            const visibleComments = post.comments ?? [];
            const edited = Boolean(post.updatedAt && post.updatedAt > post.createdAt);
            return (
            <article key={post._id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <time title={new Date(post.createdAt).toLocaleString(locale)}>
                    {new Date(post.createdAt).toLocaleDateString(locale)}
                  </time>
                  {edited && <span>{t("profile.public.edited")}</span>}
                </div>
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
                <button type="button" disabled={!userId} onClick={() => onSave(post._id)} className={`inline-flex items-center gap-1 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 ${post.savedByViewer ? "text-primary hover:text-primary" : ""}`}>
                  <Bookmark className={`h-4 w-4 ${post.savedByViewer ? "fill-current" : ""}`} />
                  {t("profile.public.savePost")}
                </button>
                <button type="button" onClick={() => sharePost(post._id)} className="inline-flex items-center gap-1 transition hover:text-foreground">
                  <Share2 className="h-4 w-4" />
                  {t("profile.public.sharePost")}
                </button>
              </div>
              {visibleComments.length > 0 && (
                <div className="space-y-3 border-t border-border pt-3">
                  {visibleComments.map((comment) => (
                    <ProfileCommentPreview key={comment._id} comment={comment} postId={post._id} userId={userId} />
                  ))}
                </div>
              )}
              {showCommentInput && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={commentBody}
                    onChange={(event) => onCommentBodyChange(post._id, event.target.value)}
                    placeholder={t("profile.public.commentPlaceholder")}
                    maxLength={500}
                  />
                  <Button size="sm" disabled={!commentBody.trim()} onClick={() => onSubmitComment(post._id)}>
                    {t("profile.networkPanel.send")}
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

function ProfileCommentPreview({
  comment,
  postId,
  userId,
  isReply = false,
}: {
  comment: ProfilePostComment;
  postId: Id<"social_posts">;
  userId: Id<"users"> | null | undefined;
  isReply?: boolean;
}) {
  const { locale, t } = useAppPreferences();
  const addComment = useMutation(api.social.addComment);
  const updateComment = useMutation(api.social.updateComment);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingBody, setEditingBody] = useState(comment.body);
  const authorName = comment.author?.username ?? comment.author?.name ?? t("profile.public.unknownUser");
  const isOwnComment = Boolean(userId && comment.author?._id === userId);
  const edited = Boolean(comment.updatedAt && comment.updatedAt > comment.createdAt);

  async function submitReply() {
    if (!userId || !replyBody.trim()) return;
    await addComment({ userId, postId, parentCommentId: comment._id, body: replyBody });
    setReplyBody("");
    setReplying(false);
  }

  async function saveEdit() {
    if (!userId || !editingBody.trim()) return;
    await updateComment({ userId, commentId: comment._id, body: editingBody });
    setEditing(false);
  }

  return (
    <div className={`grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm ${isReply ? "ml-5 border-l border-border pl-3" : ""}`}>
      <Avatar name={comment.author?.name ?? "?"} avatarUrl={comment.author?.avatarUrl ?? undefined} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-semibold leading-5">
          {authorName}
          <span className="ml-2 font-normal text-muted-foreground">{formatProfilePostTime(comment.createdAt, locale, t("profile.public.justNow"))}</span>
          {edited && <span className="ml-2 font-normal text-muted-foreground">{t("profile.public.edited")}</span>}
        </p>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} rows={2} maxLength={500} className="min-h-16 text-sm" />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t("profile.misc.cancel")}
              </Button>
              <Button type="button" size="sm" disabled={!editingBody.trim()} onClick={saveEdit}>
                {t("profile.misc.save")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-5 text-muted-foreground">{comment.body}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          {!isReply && userId && (
            <button type="button" className="transition hover:text-foreground" onClick={() => setReplying((value) => !value)}>
              {t("profile.public.reply")}
            </button>
          )}
          {isOwnComment && (
            <button type="button" className="transition hover:text-foreground" onClick={() => {
              setEditingBody(comment.body);
              setEditing(true);
            }}>
              {t("profile.misc.edit")}
            </button>
          )}
        </div>
        {replying && (
          <div className="mt-2 flex gap-2">
            <Input
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder={t("profile.public.replyPlaceholder")}
              maxLength={500}
            />
            <Button type="button" size="icon" disabled={!replyBody.trim()} onClick={submitReply}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <ProfileCommentPreview key={reply._id} comment={reply} postId={postId} userId={userId} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatProfilePostTime(timestamp: number, locale: string, justNow: string) {
  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return justNow;
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} Min.`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} Std.`;
  return new Date(timestamp).toLocaleDateString(locale);
}

function Avatar({ name, avatarUrl, size = "lg" }: { name: string; avatarUrl?: string; size?: "sm" | "lg" }) {
  const classes = size === "sm" ? "h-8 w-8 text-sm border-2" : "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl border-4";

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-background bg-muted font-semibold ${classes}`}>
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
  icon: ComponentType<{ className?: string }>;
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

"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowLeft,
  Ban,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Crown,
  Dumbbell,
  ExternalLink,
  Eye,
  Flag,
  Flame,
  Heart,
  ImageIcon,
  ImagePlus,
  Lock,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  MessageCircle,
  MoveRight,
  Paperclip,
  Pencil,
  Phone,
  PlusCircle,
  Play,
  Repeat2,
  Ruler,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Target,
  Trash2,
  Trophy,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_EXERCISES } from "@/lib/default-exercises";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { FollowDialog } from "@/components/profile/FollowDialog";
import { cn } from "@/lib/utils";

type ProfileForm = {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  avatarStorageId?: Id<"_storage">;
  coverUrl: string;
  coverStorageId?: Id<"_storage">;
  location: string;
  favoriteLift: string;
  trainingGoal: string;
  heightCm: string;
  weightKg: string;
  birthDate: string;
  isPublic: boolean;
  allowMessages: boolean;
  showTrainingSummary: boolean;
  publicBio: boolean;
  publicLocation: boolean;
  publicFavoriteLift: boolean;
  publicTrainingGoal: boolean;
  publicHeight: boolean;
  publicWeight: boolean;
  publicBirthDate: boolean;
  publicTrainingSummary: boolean;
  publicTrainingStreak: boolean;
  publicTrainingBestSet: boolean;
  publicTrainingActivity: boolean;
  publicTrainingVolume: boolean;
};

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

type ProfileTrainingSummary = {
  completedWorkouts: number;
  totalSets: number;
  totalVolume: number;
  uniqueExercises: number;
  activeWeeks: number;
  currentStreakDays: number;
  lastWorkoutAt?: number;
  averageWorkoutsPerWeek: number;
  bestSet: null | {
    exerciseName: string;
    weight: number;
    reps: number;
    volume: number;
  };
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

type VisibleProfile = {
  bio?: string;
  location?: string;
  favoriteLift?: string;
  trainingGoal?: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
};

type ProfilePost = {
  _id: Id<"social_posts">;
  authorId: Id<"users">;
  body: string;
  bodyAfter?: string;
  createdAt: number;
  updatedAt?: number;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "gif";
  mediaSize?: "sm" | "md" | "lg";
  mediaScale?: number;
  repostOfPostId?: Id<"social_posts">;
  repostedByViewer?: boolean;
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
  repostOf?: null | {
    _id: Id<"social_posts">;
    body: string;
    bodyAfter?: string;
    createdAt: number;
    mediaUrl?: string | null;
    mediaType?: "image" | "video" | "gif";
    mediaSize?: "sm" | "md" | "lg";
    mediaScale?: number;
    author: null | {
      _id: Id<"users">;
      name: string;
      username?: string;
      avatarUrl?: string | null;
      isPro: boolean;
    };
    linkedLog: null | {
      exerciseName: string | null;
      weightKg: number;
      reps: number;
      score?: number;
    };
  };
};

type ProfilePostThread =
  | {
      comments: ProfilePostComment[];
    }
  | null
  | undefined;

type MessageImageDraft = {
  storageId: Id<"_storage">;
  url: string;
  name: string;
};

type ProfilePostMediaDraft = {
  storageId: Id<"_storage">;
  url: string;
  mediaType: "image" | "video" | "gif";
  name: string;
};

const LIFT_LABELS = {
  bench_press: "Bench Press",
  squat: "Squat",
  deadlift: "Deadlift",
} as const;

type ProfileTab = "posts" | "saved" | "media" | "logs" | "training";
type ProfilePreviewTab = "posts" | "media" | "logs" | "training";
type ProfileEditSection = "details" | "visibility";
type MessageInboxFilter = "all" | "messages" | "comments" | "mentions";

export function ProfilePageClient() {
  const { userId, isLoaded } = useConvexUser();
  const { locale, t } = useAppPreferences();
  const [loadSecondary, setLoadSecondary] = useState(false);
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const publicPreview = useQuery(
    api.users.getPublicProfile,
    userId && loadSecondary ? { userId, viewerId: userId } : "skip"
  );
  const conversations = useQuery(
    api.messages.conversations,
    userId && loadSecondary ? { userId } : "skip"
  );
  const topLogs = useQuery(
    api.logs.getProfileTopLogs,
    userId && loadSecondary ? { userId, viewerId: userId, limit: 5 } : "skip"
  );
  const workoutTemplates = useQuery(
    api.workouts.listProfileTemplates,
    userId && loadSecondary ? { userId, viewerId: userId, limit: 12 } : "skip"
  );
  const catalogExercises = useQuery(
    api.exercises.search,
    loadSecondary ? { query: "", limit: 200 } : "skip"
  );
  const isOwnProfile = Boolean(userId && user?._id === userId);
  const posts = useQuery(api.social.listByAuthor, userId && loadSecondary ? { authorId: userId, viewerId: userId, limit: 30 } : "skip");
  const savedPosts = useQuery(api.social.listSaved, userId && isOwnProfile && loadSecondary ? { userId, limit: 30 } : "skip");
  const friends = useQuery(api.friends.list, userId && loadSecondary ? { userId } : "skip");
  const followGraph = useQuery(
    api.follows.listForProfile,
    userId && loadSecondary ? { userId, viewerId: userId, limit: 80 } : "skip"
  );
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const createProfilePost = useMutation(api.social.createPost);
  const generatePostUploadUrl = useMutation(api.social.generateUploadUrl);
  const updateProfilePost = useMutation(api.social.updatePost);
  const deleteProfilePost = useMutation(api.social.deletePost);
  const updateWorkoutTemplate = useMutation(api.workouts.updateTemplateVisibility);
  const deleteWorkoutTemplate = useMutation(api.workouts.deleteTemplate);
  const togglePostLike = useMutation(api.social.toggleLike);
  const togglePostSave = useMutation(api.social.toggleSave);
  const addProfilePostComment = useMutation(api.social.addComment);
  const repostProfilePost = useMutation(api.social.createPost);
  const addFriend = useMutation(api.friends.addByUsername);
  const removeFriend = useMutation(api.friends.remove);
  const followUser = useMutation(api.follows.follow);
  const unfollowUser = useMutation(api.follows.unfollow);
  const sendMessage = useMutation(api.messages.send);
  const generateMessageUploadUrl = useMutation(api.messages.generateUploadUrl);
  const markRead = useMutation(api.messages.markConversationRead);
  const blockUser = useMutation(api.messages.blockUser);
  const unblockUser = useMutation(api.messages.unblockUser);
  const reportMessage = useMutation(api.messages.reportMessage);

  const [query, setQuery] = useState("");
  const searchResults = useQuery(
    api.users.searchPublic,
    userId && query.trim().length >= 2 ? { query, viewerId: userId } : "skip"
  );
  const [messageTarget, setMessageTarget] = useState<Id<"users"> | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<Id<"conversations"> | null>(null);
  const thread = useQuery(
    api.messages.thread,
    userId && activeConversation ? { userId, conversationId: activeConversation } : "skip"
  );
  const [messageBody, setMessageBody] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [messageInboxFilter, setMessageInboxFilter] = useState<MessageInboxFilter>("all");
  const [messageImageDraft, setMessageImageDraft] = useState<MessageImageDraft | null>(null);
  const [messageUploadError, setMessageUploadError] = useState("");
  const [uploadingMessageImage, setUploadingMessageImage] = useState(false);
  const [profilePostBody, setProfilePostBody] = useState("");
  const [profilePostCommentBodies, setProfilePostCommentBodies] = useState<Record<string, string>>({});
  const [activeProfileCommentPostId, setActiveProfileCommentPostId] = useState<string | null>(null);
  const profilePostThread = useQuery(
    api.social.getPostThread,
    activeProfileCommentPostId
      ? {
          postId: activeProfileCommentPostId as Id<"social_posts">,
          viewerId: userId ?? undefined,
          commentLimit: 40,
          replyLimit: 12,
        }
      : "skip"
  );
  const [openProfilePostMenuId, setOpenProfilePostMenuId] = useState<string | null>(null);
  const [editingProfilePostId, setEditingProfilePostId] = useState<string | null>(null);
  const [editingProfilePostBodies, setEditingProfilePostBodies] = useState<Record<string, string>>({});
  const [pendingProfilePostDelete, setPendingProfilePostDelete] = useState<Id<"social_posts"> | null>(null);
  const [openWorkoutTemplateMenuId, setOpenWorkoutTemplateMenuId] = useState<string | null>(null);
  const [editingWorkoutTemplateId, setEditingWorkoutTemplateId] = useState<string | null>(null);
  const [workoutTemplateDrafts, setWorkoutTemplateDrafts] = useState<Record<string, {
    name: string;
    description: string;
    visibility: "private" | "friends" | "public";
    showWeights: boolean;
  }>>({});
  const [pendingWorkoutTemplateDelete, setPendingWorkoutTemplateDelete] = useState<Id<"workout_templates"> | null>(null);
  const [profilePostMediaDraft, setProfilePostMediaDraft] = useState<ProfilePostMediaDraft | null>(null);
  const [profilePostError, setProfilePostError] = useState("");
  const [uploadingProfilePostMedia, setUploadingProfilePostMedia] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<Id<"messages"> | null>(null);
  const [reportReason, setReportReason] = useState(t("profile.messagesPanel.reportDefault"));
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [friendError, setFriendError] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState<"edit" | "preview">("edit");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("posts");
  const [previewProfileTab, setPreviewProfileTab] = useState<ProfilePreviewTab>("posts");
  const [profileEditSection, setProfileEditSection] = useState<ProfileEditSection>("details");
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false);
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [messageThreadMenuOpen, setMessageThreadMenuOpen] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileTabRefs = useRef<Partial<Record<ProfileTab, HTMLButtonElement | null>>>({});
  const previewTabRefs = useRef<Partial<Record<ProfilePreviewTab, HTMLButtonElement | null>>>({});
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    username: "",
    bio: "",
    avatarUrl: "",
    avatarStorageId: undefined,
    coverUrl: "",
    coverStorageId: undefined,
    location: "",
    favoriteLift: "",
    trainingGoal: "",
    heightCm: "",
    weightKg: "",
    birthDate: "",
    isPublic: true,
    allowMessages: true,
    showTrainingSummary: true,
    publicBio: true,
    publicLocation: true,
    publicFavoriteLift: true,
    publicTrainingGoal: true,
    publicHeight: false,
    publicWeight: false,
    publicBirthDate: false,
    publicTrainingSummary: true,
    publicTrainingStreak: true,
    publicTrainingBestSet: true,
    publicTrainingActivity: true,
    publicTrainingVolume: true,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoadSecondary(true), 120);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function selectTabFromHash() {
      const hash = window.location.hash;
      if (hash === "#messages") setMessagesDialogOpen(true);
      if (hash === "#network" || hash === "#friends") setNetworkDialogOpen(true);
      if (hash === "#training" || hash === "#workouts" || hash === "#playlists") setActiveProfileTab("training");
    }

    selectTabFromHash();
    window.addEventListener("hashchange", selectTabFromHash);
    return () => window.removeEventListener("hashchange", selectTabFromHash);
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
      avatarStorageId: user.avatarStorageId,
      coverUrl: user.coverUrl ?? "",
      coverStorageId: user.coverStorageId,
      location: user.location ?? "",
      favoriteLift: user.favoriteLift ?? "",
      trainingGoal: user.trainingGoal ?? "",
      heightCm: user.heightCm?.toString() ?? "",
      weightKg: user.weightKg?.toString() ?? "",
      birthDate: user.birthDate ?? "",
      isPublic: user.isPublic ?? true,
      allowMessages: user.allowMessages ?? true,
      showTrainingSummary: user.showTrainingSummary ?? true,
      publicBio: user.publicFields?.bio ?? true,
      publicLocation: user.publicFields?.location ?? true,
      publicFavoriteLift: user.publicFields?.favoriteLift ?? true,
      publicTrainingGoal: user.publicFields?.trainingGoal ?? true,
      publicHeight: user.publicFields?.heightCm ?? false,
      publicWeight: user.publicFields?.weightKg ?? false,
      publicBirthDate: user.publicFields?.birthDate ?? false,
      publicTrainingSummary: user.publicFields?.trainingSummary ?? true,
      publicTrainingStreak: user.publicFields?.trainingStreak ?? user.publicFields?.trainingSummary ?? true,
      publicTrainingBestSet: user.publicFields?.trainingBestSet ?? user.publicFields?.trainingSummary ?? true,
      publicTrainingActivity: user.publicFields?.trainingActivity ?? user.publicFields?.trainingSummary ?? true,
      publicTrainingVolume: user.publicFields?.trainingVolume ?? user.publicFields?.trainingSummary ?? true,
    });
    setAvatarPreviewUrl("");
    setCoverPreviewUrl("");
  }, [user]);

  useEffect(() => {
    if (!userId || !activeConversation) return;
    void markRead({ userId, conversationId: activeConversation });
  }, [activeConversation, markRead, userId, thread?.messages.length]);

  useEffect(() => {
    if (!messagesDialogOpen || !thread?.messages.length) return;
    requestAnimationFrame(() => {
      latestMessageRef.current?.scrollIntoView({ block: "end" });
      setShowJumpToLatest(false);
    });
  }, [activeConversation, messagesDialogOpen, thread?.messages.length]);

  useEffect(() => {
    setMessageThreadMenuOpen(false);
  }, [activeConversation]);

  function handleMessagesScroll() {
    const element = messagesScrollRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 180);
  }

  useEffect(() => {
    if (!isOwnProfile && activeProfileTab === "saved") {
      setActiveProfileTab("posts");
    }
  }, [activeProfileTab, isOwnProfile]);

  useEffect(() => {
    profileTabRefs.current[activeProfileTab]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeProfileTab]);

  useEffect(() => {
    previewTabRefs.current[previewProfileTab]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [previewProfileTab]);

  useEffect(() => {
    return () => {
      if (messageImageDraft?.url) URL.revokeObjectURL(messageImageDraft.url);
    };
  }, [messageImageDraft]);

  useEffect(() => {
    return () => {
      if (profilePostMediaDraft?.url) URL.revokeObjectURL(profilePostMediaDraft.url);
    };
  }, [profilePostMediaDraft]);

  const unreadTotal = useMemo(
    () => conversations?.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0,
    [conversations]
  );
  const filteredConversations = useMemo(() => {
    if (!conversations) return conversations;
    if (messageInboxFilter === "comments" || messageInboxFilter === "mentions") return [];
    const normalizedSearch = messageSearch.trim().toLowerCase();
    if (!normalizedSearch) return conversations;

    return conversations.filter((conversation) => {
      const otherUser = conversation.otherUser;
      return (
        otherUser?.name?.toLowerCase().includes(normalizedSearch) ||
        otherUser?.username?.toLowerCase().includes(normalizedSearch) ||
        conversation.lastMessagePreview?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [conversations, messageInboxFilter, messageSearch]);
  const visibleConversations = filteredConversations ?? [];
  const mediaPosts = useMemo(() => posts?.filter((post) => Boolean(post.mediaUrl)), [posts]);
  const displayAvatarUrl = avatarPreviewUrl || form.avatarUrl;
  const displayCoverUrl = coverPreviewUrl || form.coverUrl;
  const rawVisibleProfile = publicPreview ?? user;
  const hasAnyPublicWorkoutStat =
    form.publicTrainingStreak ||
    form.publicTrainingBestSet ||
    form.publicTrainingActivity ||
    form.publicTrainingVolume;
  const publicVisibleProfile: VisibleProfile = form.isPublic
    ? {
        bio: form.publicBio ? form.bio : undefined,
        location: form.publicLocation ? form.location : undefined,
        favoriteLift: form.publicFavoriteLift ? form.favoriteLift : undefined,
        trainingGoal: form.publicTrainingGoal ? form.trainingGoal : undefined,
        heightCm: form.publicHeight && form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.publicWeight && form.weightKg ? Number(form.weightKg) : undefined,
        birthDate: form.publicBirthDate ? form.birthDate : undefined,
      }
    : {};
  const visibleProfile = isOwnProfile ? publicVisibleProfile : rawVisibleProfile;
  const trainingSummary =
    isOwnProfile
      ? form.isPublic && form.showTrainingSummary && hasAnyPublicWorkoutStat
        ? publicPreview?.trainingSummary
        : null
      : publicPreview?.trainingSummary;
  const topLog = topLogs?.[0];
  const bestSet = trainingSummary?.bestSet;
  const primaryLift = bestSet
    ? `${bestSet.weight} kg x ${bestSet.reps}`
    : !isOwnProfile && topLog
      ? `${topLog.submission.weightKg} kg x ${topLog.submission.reps}`
      : null;
  const primaryLiftLabel =
    bestSet?.exerciseName ??
    (!isOwnProfile ? topLog?.exerciseName : undefined) ??
    visibleProfile?.favoriteLift ??
    "Top Lift";
  const streakDays = String(trainingSummary?.currentStreakDays ?? 0);
  const weeklyActivityValue = trainingSummary ? `${trainingSummary.averageWorkoutsPerWeek} / ${t("profile.metrics.week")}` : "";
  const volumeThirtyDays = trainingSummary
    ? `${Math.round(trainingSummary.totalVolume).toLocaleString(locale)} kg`
    : "";
  const joinedLabel = user?._creationTime
    ? `${t("profile.meta.since")} ${new Date(user._creationTime).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
      })}`
    : t("profile.meta.sinceRecently");
  const profileMeta = [
    visibleProfile?.location ? { icon: MapPin, value: visibleProfile.location } : null,
    visibleProfile?.heightCm ? { icon: Ruler, value: `${visibleProfile.heightCm} cm` } : null,
    { icon: Calendar, value: joinedLabel },
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; value: string }>;
  const profileTabs = [
    { id: "posts", label: t("profile.tabs.posts") },
    ...(isOwnProfile ? [{ id: "saved", label: t("profile.tabs.saved") } as const] : []),
    { id: "media", label: t("profile.tabs.media") },
    { id: "logs", label: t("profile.tabs.logs") },
    { id: "training", label: t("profile.tabs.training") },
  ] satisfies Array<{ id: ProfileTab; label: string }>;
  const previewTrainingSummary =
    form.isPublic && form.showTrainingSummary && hasAnyPublicWorkoutStat ? trainingSummary : null;
  const previewBestSet = previewTrainingSummary?.bestSet;
  const profileMetricItems = [
    form.publicTrainingStreak && trainingSummary
      ? {
          key: "streak",
          icon: Flame,
          iconClassName: "text-primary",
          value: streakDays,
          label: t("profile.metrics.streak"),
        }
      : null,
    form.publicTrainingBestSet && bestSet
      ? {
          key: "topLift",
          icon: Dumbbell,
          value: primaryLift ?? "",
          label: t("profile.metrics.topLift"),
          detail: primaryLiftLabel,
        }
      : null,
    form.publicTrainingActivity && trainingSummary
      ? {
          key: "activity",
          icon: Activity,
          iconClassName: "text-primary",
          value: weeklyActivityValue,
          label: t("profile.metrics.activity"),
        }
      : null,
    form.publicTrainingVolume && trainingSummary
      ? {
          key: "volume",
          icon: Users,
          iconClassName: "text-primary",
          value: volumeThirtyDays,
          label: t("profile.metrics.volume30"),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: ComponentType<{ className?: string }>;
    iconClassName?: string;
    value: string;
    label: string;
    detail?: string;
  }>;
  const previewMetricItems = [
    form.publicTrainingStreak && previewTrainingSummary
      ? {
          key: "streak",
          icon: Flame,
          iconClassName: "text-primary",
          value: String(previewTrainingSummary.currentStreakDays),
          label: t("profile.metrics.streak"),
        }
      : null,
    form.publicTrainingBestSet && previewBestSet
      ? {
          key: "topLift",
          icon: Dumbbell,
          value: `${previewBestSet.weight} kg x ${previewBestSet.reps}`,
          label: t("profile.metrics.topLift"),
          detail: previewBestSet.exerciseName,
        }
      : null,
    form.publicTrainingActivity && previewTrainingSummary
      ? {
          key: "activity",
          icon: Activity,
          iconClassName: "text-primary",
          value: `${previewTrainingSummary.averageWorkoutsPerWeek} / ${t("profile.metrics.week")}`,
          label: t("profile.metrics.activity"),
        }
      : null,
    form.publicTrainingVolume && previewTrainingSummary
      ? {
          key: "volume",
          icon: Users,
          iconClassName: "text-primary",
          value: `${Math.round(previewTrainingSummary.totalVolume).toLocaleString(locale)} kg`,
          label: t("profile.metrics.volume30"),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: ComponentType<{ className?: string }>;
    iconClassName?: string;
    value: string;
    label: string;
    detail?: string;
  }>;
  const hasVisiblePreviewMetric =
    Boolean(previewTrainingSummary) && previewMetricItems.length > 0;
  const previewVisibleProfile: VisibleProfile = publicVisibleProfile;
  const previewMeta = [
    previewVisibleProfile.location ? { icon: MapPin, value: previewVisibleProfile.location } : null,
    previewVisibleProfile.heightCm ? { icon: Ruler, value: `${previewVisibleProfile.heightCm} cm` } : null,
    { icon: Calendar, value: joinedLabel },
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; value: string }>;
  const previewTemplates = form.isPublic ? workoutTemplates?.filter((template) => template.visibility === "public") : [];
  const previewTabs = [
    { id: "posts", label: t("profile.tabs.posts") },
    { id: "media", label: t("profile.tabs.media") },
    { id: "logs", label: t("profile.tabs.logs") },
    { id: "training", label: t("profile.tabs.training") },
  ] satisfies Array<{ id: ProfilePreviewTab; label: string }>;
  const favoriteLiftOptions = useMemo(() => {
    const names = new Set<string>();
    for (const exercise of catalogExercises && catalogExercises.length > 0 ? catalogExercises : DEFAULT_EXERCISES) {
      names.add(exercise.name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "de"));
  }, [catalogExercises]);

  if (isLoaded && !userId) {
    return (
      <EmptyState
        icon={User}
        title={t("profile.misc.signedOutTitle")}
        description={t("profile.misc.signedOutCopy")}
        action={
          <Link href="/sign-in">
            <Button>{t("profile.misc.signIn")}</Button>
          </Link>
        }
      />
    );
  }

  async function saveProfile() {
    if (!userId) return;
    const favoriteLift = form.favoriteLift.trim();
    const normalizedFavoriteLift = favoriteLift.toLowerCase();
    if (
      normalizedFavoriteLift &&
      !favoriteLiftOptions.some((exerciseName) => exerciseName.toLowerCase().includes(normalizedFavoriteLift))
    ) {
      setUploadError(t("profile.errors.favoriteLiftCatalog"));
      return;
    }
    setUploadError("");
    await updateProfile({
      userId,
      name: form.name,
      username: form.username,
      bio: form.bio || undefined,
      avatarUrl: form.avatarUrl || undefined,
      avatarStorageId: form.avatarStorageId,
      coverUrl: form.coverUrl || undefined,
      coverStorageId: form.coverStorageId,
      location: form.location || undefined,
      favoriteLift: favoriteLift || undefined,
      trainingGoal: form.trainingGoal || undefined,
      profileAccent: "emerald",
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      birthDate: form.birthDate || undefined,
      isPublic: form.isPublic,
      allowMessages: form.allowMessages,
      showTrainingSummary: form.showTrainingSummary,
      publicFields: {
        bio: form.publicBio,
        location: form.publicLocation,
        favoriteLift: form.publicFavoriteLift,
        trainingGoal: form.publicTrainingGoal,
        heightCm: form.publicHeight,
        weightKg: form.publicWeight,
        birthDate: form.publicBirthDate,
        trainingSummary: hasAnyPublicWorkoutStat,
        trainingStreak: form.publicTrainingStreak,
        trainingBestSet: form.publicTrainingBestSet,
        trainingActivity: form.publicTrainingActivity,
        trainingVolume: form.publicTrainingVolume,
      },
    });
    setSaved(true);
    setEditProfileOpen(false);
    window.setTimeout(() => setSaved(false), 2200);
  }

  async function uploadProfileImage(file: File | undefined, kind: "avatar" | "cover") {
    if (!userId || !file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError(t("profile.errors.imageOnly"));
      return;
    }
    const maxSize = kind === "avatar" ? 4 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(kind === "avatar" ? t("profile.errors.avatarTooLarge") : t("profile.errors.coverTooLarge"));
      return;
    }

    setUploading(kind);
    try {
      const postUrl = await generateUploadUrl({ userId, kind });
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error(t("profile.errors.uploadFailed"));
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      const previewUrl = URL.createObjectURL(file);
      if (kind === "avatar") {
        if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(previewUrl);
        setForm((current) => ({ ...current, avatarUrl: "", avatarStorageId: storageId }));
        setAvatarMenuOpen(false);
      } else {
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl(previewUrl);
        setForm((current) => ({ ...current, coverUrl: "", coverStorageId: storageId }));
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t("profile.errors.uploadFailed"));
    } finally {
      setUploading(null);
    }
  }

  async function uploadMessageImage(file: File | undefined) {
    if (!userId || !file) return;
    setMessageUploadError("");
    if (!file.type.startsWith("image/")) {
      setMessageUploadError("Bitte wähle eine Bilddatei aus.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessageUploadError("Bildnachrichten dürfen maximal 8 MB groß sein.");
      return;
    }

    setUploadingMessageImage(true);
    try {
      const postUrl = await generateMessageUploadUrl({ userId });
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload fehlgeschlagen.");
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      if (messageImageDraft?.url) URL.revokeObjectURL(messageImageDraft.url);
      setMessageImageDraft({
        storageId,
        url: URL.createObjectURL(file),
        name: file.name,
      });
    } catch (error) {
      setMessageUploadError(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploadingMessageImage(false);
    }
  }

  async function uploadProfilePostMedia(file: File | undefined) {
    if (!userId || !file) return;
    setProfilePostError("");
    const mediaType =
      file.type === "image/gif"
        ? "gif"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("image/")
            ? "image"
            : null;
    if (!mediaType) {
      setProfilePostError("Bitte Bild oder Video auswählen.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setProfilePostError("Medien dürfen maximal 30 MB groß sein.");
      return;
    }

    setUploadingProfilePostMedia(true);
    try {
      const postUrl = await generatePostUploadUrl({ userId, mediaType });
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload fehlgeschlagen.");
      const result = (await response.json()) as { storageId: Id<"_storage"> };
      if (profilePostMediaDraft?.url) URL.revokeObjectURL(profilePostMediaDraft.url);
      setProfilePostMediaDraft({
        storageId: result.storageId,
        url: URL.createObjectURL(file),
        mediaType,
        name: file.name,
      });
    } catch (uploadError) {
      setProfilePostError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setUploadingProfilePostMedia(false);
    }
  }

  function removeProfileImage(kind: "avatar" | "cover") {
    if (kind === "avatar") {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl("");
      setAvatarMenuOpen(false);
      setForm((current) => ({ ...current, avatarUrl: "", avatarStorageId: undefined }));
      return;
    }

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl("");
    setForm((current) => ({ ...current, coverUrl: "", coverStorageId: undefined }));
  }

  function closeProfileEditor() {
    setEditProfileOpen(false);
    setProfileEditMode("edit");
    setProfileEditSection("details");
    setAvatarMenuOpen(false);
  }

  function clearProfilePostMediaDraft() {
    if (profilePostMediaDraft?.url) URL.revokeObjectURL(profilePostMediaDraft.url);
    setProfilePostMediaDraft(null);
    setProfilePostError("");
  }

  async function submitProfilePost() {
    if (!userId || (!profilePostBody.trim() && !profilePostMediaDraft)) return;
    setProfilePostError("");
    try {
      await createProfilePost({
        authorId: userId,
        body: profilePostBody,
        mediaStorageId: profilePostMediaDraft?.storageId,
        mediaType: profilePostMediaDraft?.mediaType,
        mediaSize: "lg",
      });
      setProfilePostBody("");
      clearProfilePostMediaDraft();
    } catch (postError) {
      setProfilePostError(postError instanceof Error ? postError.message : t("profile.errors.createPostFailed"));
    }
  }

  async function submitProfilePostComment(postId: Id<"social_posts">) {
    if (!userId) return;
    const body = profilePostCommentBodies[postId]?.trim();
    if (!body) return;
    await addProfilePostComment({ userId, postId, body });
    setProfilePostCommentBodies((current) => ({ ...current, [postId]: "" }));
  }

  async function repostFromProfile(postId: Id<"social_posts">) {
    if (!userId) return;
    try {
      await repostProfilePost({ authorId: userId, body: "", repostOfPostId: postId });
    } catch (repostError) {
      setProfilePostError(repostError instanceof Error ? repostError.message : "Repost fehlgeschlagen.");
    }
  }

  async function saveProfilePostEdit(post: ProfilePost) {
    if (!userId) return;
    const body = editingProfilePostBodies[post._id] ?? post.body ?? "";
    await updateProfilePost({ userId, postId: post._id, body });
    setEditingProfilePostId(null);
    setEditingProfilePostBodies((current) => {
      const next = { ...current };
      delete next[post._id];
      return next;
    });
  }

  async function confirmProfilePostDelete() {
    if (!userId || !pendingProfilePostDelete) return;
    await deleteProfilePost({ userId, postId: pendingProfilePostDelete });
    setPendingProfilePostDelete(null);
    setOpenProfilePostMenuId(null);
    if (editingProfilePostId === pendingProfilePostDelete) setEditingProfilePostId(null);
  }

  function toggleFollow(targetId: Id<"users">, following: boolean) {
    if (!userId) return;
    if (following) {
      void unfollowUser({ followerId: userId, followingId: targetId });
    } else {
      void followUser({ followerId: userId, followingId: targetId });
    }
  }

  function editWorkoutTemplate(template: ProfileWorkoutTemplate) {
    setOpenWorkoutTemplateMenuId(null);
    setEditingWorkoutTemplateId(template._id);
    setWorkoutTemplateDrafts((current) => ({
      ...current,
      [template._id]: {
        name: template.name,
        description: template.description ?? "",
        visibility: template.visibility,
        showWeights: template.showWeights,
      },
    }));
  }

  function cancelWorkoutTemplateEdit(templateId: Id<"workout_templates">) {
    setEditingWorkoutTemplateId(null);
    setWorkoutTemplateDrafts((current) => {
      const next = { ...current };
      delete next[templateId];
      return next;
    });
  }

  async function saveWorkoutTemplateEdit(template: ProfileWorkoutTemplate) {
    if (!userId) return;
    const draft = workoutTemplateDrafts[template._id];
    if (!draft || !draft.name.trim()) return;
    await updateWorkoutTemplate({
      userId,
      templateId: template._id,
      name: draft.name,
      description: draft.description || undefined,
      visibility: draft.visibility,
      showWeights: draft.showWeights,
    });
    cancelWorkoutTemplateEdit(template._id);
  }

  async function confirmWorkoutTemplateDelete() {
    if (!userId || !pendingWorkoutTemplateDelete) return;
    await deleteWorkoutTemplate({ userId, templateId: pendingWorkoutTemplateDelete });
    setPendingWorkoutTemplateDelete(null);
    setOpenWorkoutTemplateMenuId(null);
    if (editingWorkoutTemplateId === pendingWorkoutTemplateDelete) setEditingWorkoutTemplateId(null);
  }

  function clearMessageImageDraft() {
    if (messageImageDraft?.url) URL.revokeObjectURL(messageImageDraft.url);
    setMessageImageDraft(null);
    setMessageUploadError("");
  }

  async function submitMessage(targetId?: Id<"users">) {
    if (!userId || (!messageBody.trim() && !messageImageDraft)) return;
    const recipientId = targetId ?? thread?.otherUser?._id ?? messageTarget;
    if (!recipientId) return;
    await sendMessage({
      senderId: userId,
      recipientId,
      body: messageBody,
      ...(messageImageDraft
        ? {
            type: "image" as const,
            mediaStorageId: messageImageDraft.storageId,
            mediaType: "image" as const,
          }
        : {}),
    });
    setMessageBody("");
    clearMessageImageDraft();
    setMessageTarget(null);
  }

  async function submitReport() {
    if (!userId || !reportedMessage) return;
    await reportMessage({
      reporterId: userId,
      messageId: reportedMessage,
      reason: reportReason,
    });
    setReportedMessage(null);
    setReportReason(t("profile.messagesPanel.reportDefault"));
  }

  async function shareProfile() {
    const profilePath = userId ? `/profile/${userId}` : "/profile";
    const profileUrl = `${window.location.origin}${profilePath}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: form.name || t("profile.public.shareTitle"),
          text: form.bio || t("profile.public.shareText"),
          url: profileUrl,
        });
        return;
      }
      await navigator.clipboard?.writeText(profileUrl);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      // Closing the native share sheet should not break the profile UI.
    }
  }

  const profileCoverStyle = {
    backgroundImage: displayCoverUrl
      ? `url(${displayCoverUrl})`
      : "url(/brand/profile-cover.png)",
  };

  return (
    <div className="-mx-3 -mt-3 bg-background pb-8 text-foreground sm:mx-auto sm:mt-0 sm:max-w-5xl sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border">
      <div className="space-y-0">
        <Card className="overflow-hidden rounded-none border-0 bg-card py-0 text-card-foreground ring-0 shadow-none">
          <div
            className="relative min-h-[28.5rem] overflow-hidden bg-cover bg-center sm:min-h-[32rem]"
            style={profileCoverStyle}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/42 to-background" />
            <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between sm:left-7 sm:right-7 sm:top-6">
              <Button size="icon" variant="ghost" className="size-9 rounded-full text-white hover:bg-white/10 sm:size-11" aria-label={t("profile.misc.back")} onClick={() => history.back()}>
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <ProfileHeaderActions
                unreadTotal={unreadTotal}
                onShare={shareProfile}
                onOpenMessages={() => setMessagesDialogOpen(true)}
                onOpenNetwork={() => setNetworkDialogOpen(true)}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-9 sm:pb-8">
              <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-5 min-[390px]:gap-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
                <div className="relative size-24 self-start min-[390px]:size-28 sm:size-44">
                  <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/25 blur-2xl" />
                  <Avatar name={form.name} avatarUrl={displayAvatarUrl} size="hero" />
                </div>
                <div className="min-w-0">
                  <Badge className="mb-2 rounded-full border-primary/20 bg-primary/15 px-2.5 py-0.5 text-[0.68rem] text-primary shadow-sm sm:mb-4 sm:px-4 sm:py-1 sm:text-sm">
                    {form.isPublic ? t("profile.status.public") : t("profile.status.private")}
                  </Badge>
                  <h1 className="flex min-w-0 items-center gap-2 text-[2rem] font-black leading-none tracking-normal min-[390px]:text-[2.25rem] sm:text-6xl">
                    <span className="truncate">{form.name || "Steffen"}</span>
                    <BadgeCheck className="h-7 w-7 shrink-0 fill-primary text-black sm:h-10 sm:w-10" />
                  </h1>
                  <p className="mt-2 text-[1.12rem] leading-tight text-muted-foreground min-[390px]:text-[1.25rem] sm:text-2xl">@{form.username || "shaker1"}</p>
                  <button
                    type="button"
                    className="mt-2 text-left text-sm font-medium text-muted-foreground transition hover:text-foreground sm:text-base"
                    onClick={() => setFollowDialogOpen(true)}
                  >
                    {(followGraph?.followerCount ?? 0).toLocaleString(locale)} {t("profile.follow.followerLine")}
                  </button>
                  {visibleProfile?.bio && (
                    <p className="mt-4 max-w-[34rem] whitespace-pre-wrap text-[1rem] font-semibold leading-[1.35] text-foreground min-[390px]:text-[1.08rem] sm:mt-8 sm:text-3xl">
                      {visibleProfile.bio}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[0.85rem] text-muted-foreground min-[390px]:text-[0.95rem] sm:mt-8 sm:gap-x-8 sm:text-xl">
                    {profileMeta.map(({ icon: Icon, value }) => (
                      <span key={value} className="inline-flex items-center gap-2 sm:gap-3">
                        <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="relative z-10 space-y-4 bg-background px-5 pb-7 pt-0 sm:space-y-6 sm:px-7 lg:px-9">
            <div className="grid gap-2.5 sm:gap-3">
              <Button type="button" className="h-12 w-full rounded-2xl text-base font-semibold transition-all hover:-translate-y-0.5 sm:h-14 sm:text-lg" onClick={() => setEditProfileOpen(true)}>
                {t("profile.edit.title")}
              </Button>
            </div>
            {profileMetricItems.length > 0 && (
              <div
                className={cn(
                  "premium-panel grid grid-cols-2 overflow-hidden rounded-2xl",
                  profileMetricItems.length > 2 && "min-[420px]:grid-cols-4"
                )}
              >
                {profileMetricItems.map((metric) => (
                  <ProfileMetric
                    key={metric.key}
                    icon={metric.icon}
                    iconClassName={metric.iconClassName}
                    value={metric.value}
                    label={metric.label}
                    detail={metric.detail}
                  />
                ))}
              </div>
            )}
            <div className="-mx-5 overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">
              <div className="flex w-max min-w-full gap-3 sm:gap-5">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      profileTabRefs.current[tab.id] = node;
                    }}
                    type="button"
                    onClick={() => setActiveProfileTab(tab.id)}
                    className={cn(
                      "relative min-h-11 shrink-0 whitespace-nowrap px-1.5 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-12 sm:px-1 sm:text-lg",
                      activeProfileTab === tab.id && "text-foreground"
                    )}
                  >
                    {tab.label}
                    {activeProfileTab === tab.id && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {activeProfileTab === "posts" && (
              <ProfilePostComposer
                body={profilePostBody}
                mediaDraft={profilePostMediaDraft}
                error={profilePostError}
                uploading={uploadingProfilePostMedia}
                disabled={!userId || uploadingProfilePostMedia || (!profilePostBody.trim() && !profilePostMediaDraft)}
                profileName={form.name || user?.name || "GymLogs User"}
                avatarUrl={displayAvatarUrl}
                onBodyChange={setProfilePostBody}
                onFile={uploadProfilePostMedia}
                onClearMedia={clearProfilePostMediaDraft}
                onSubmit={submitProfilePost}
              />
            )}
            {activeProfileTab === "posts" && (
              <ProfilePostsCard
                posts={posts}
                profileName={form.name || "GymLogs User"}
                username={form.username || "username"}
                avatarUrl={displayAvatarUrl}
                isPro={Boolean(user?.isPro)}
                userId={userId}
                canManagePosts={isOwnProfile}
                commentBodies={profilePostCommentBodies}
                activeCommentPostId={activeProfileCommentPostId}
                activeThread={profilePostThread}
                openPostMenuId={openProfilePostMenuId}
                editingPostId={editingProfilePostId}
                editingPostBodies={editingProfilePostBodies}
                onLike={(postId) => userId && togglePostLike({ userId, postId })}
                onSave={(postId) => userId && togglePostSave({ userId, postId })}
                onRepost={repostFromProfile}
                onOpenPostMenu={setOpenProfilePostMenuId}
                onEditPost={(post) => {
                  setOpenProfilePostMenuId(null);
                  setEditingProfilePostId(post._id);
                  setEditingProfilePostBodies((current) => ({ ...current, [post._id]: post.body ?? "" }));
                }}
                onDeletePost={(postId) => {
                  setOpenProfilePostMenuId(null);
                  setPendingProfilePostDelete(postId);
                }}
                onEditingPostBodyChange={(postId, body) =>
                  setEditingProfilePostBodies((current) => ({ ...current, [postId]: body }))
                }
                onCancelPostEdit={(postId) => {
                  setEditingProfilePostId(null);
                  setEditingProfilePostBodies((current) => {
                    const next = { ...current };
                    delete next[postId];
                    return next;
                  });
                }}
                onSavePostEdit={saveProfilePostEdit}
                onToggleComment={(postId) =>
                  setActiveProfileCommentPostId((current) => current === postId ? null : postId)
                }
                onCommentBodyChange={(postId, body) =>
                  setProfilePostCommentBodies((current) => ({ ...current, [postId]: body }))
                }
                onSubmitComment={submitProfilePostComment}
              />
            )}
            {isOwnProfile && activeProfileTab === "saved" && (
              <ProfilePostsCard
                posts={savedPosts}
                profileName={form.name || "GymLogs User"}
                username={form.username || "username"}
                avatarUrl={displayAvatarUrl}
                isPro={Boolean(user?.isPro)}
                userId={userId}
                canManagePosts={false}
                commentBodies={profilePostCommentBodies}
                activeCommentPostId={activeProfileCommentPostId}
                activeThread={profilePostThread}
                openPostMenuId={openProfilePostMenuId}
                editingPostId={editingProfilePostId}
                editingPostBodies={editingProfilePostBodies}
                onLike={(postId) => userId && togglePostLike({ userId, postId })}
                onSave={(postId) => userId && togglePostSave({ userId, postId })}
                onRepost={repostFromProfile}
                onOpenPostMenu={setOpenProfilePostMenuId}
                onEditPost={(post) => {
                  setOpenProfilePostMenuId(null);
                  setEditingProfilePostId(post._id);
                  setEditingProfilePostBodies((current) => ({ ...current, [post._id]: post.body ?? "" }));
                }}
                onDeletePost={(postId) => {
                  setOpenProfilePostMenuId(null);
                  setPendingProfilePostDelete(postId);
                }}
                onEditingPostBodyChange={(postId, body) =>
                  setEditingProfilePostBodies((current) => ({ ...current, [postId]: body }))
                }
                onCancelPostEdit={(postId) => {
                  setEditingProfilePostId(null);
                  setEditingProfilePostBodies((current) => {
                    const next = { ...current };
                    delete next[postId];
                    return next;
                  });
                }}
                onSavePostEdit={saveProfilePostEdit}
                onToggleComment={(postId) =>
                  setActiveProfileCommentPostId((current) => current === postId ? null : postId)
                }
                onCommentBodyChange={(postId, body) =>
                  setProfilePostCommentBodies((current) => ({ ...current, [postId]: body }))
                }
                onSubmitComment={submitProfilePostComment}
                emptyTitle={t("profile.public.postsEmptyTitle")}
              />
            )}
            {activeProfileTab === "media" && (
              <ProfilePostsCard
                posts={mediaPosts}
                profileName={form.name || "GymLogs User"}
                username={form.username || "username"}
                avatarUrl={displayAvatarUrl}
                isPro={Boolean(user?.isPro)}
                userId={userId}
                canManagePosts={isOwnProfile}
                commentBodies={profilePostCommentBodies}
                activeCommentPostId={activeProfileCommentPostId}
                activeThread={profilePostThread}
                openPostMenuId={openProfilePostMenuId}
                editingPostId={editingProfilePostId}
                editingPostBodies={editingProfilePostBodies}
                onLike={(postId) => userId && togglePostLike({ userId, postId })}
                onSave={(postId) => userId && togglePostSave({ userId, postId })}
                onRepost={repostFromProfile}
                onOpenPostMenu={setOpenProfilePostMenuId}
                onEditPost={(post) => {
                  setOpenProfilePostMenuId(null);
                  setEditingProfilePostId(post._id);
                  setEditingProfilePostBodies((current) => ({ ...current, [post._id]: post.body ?? "" }));
                }}
                onDeletePost={(postId) => {
                  setOpenProfilePostMenuId(null);
                  setPendingProfilePostDelete(postId);
                }}
                onEditingPostBodyChange={(postId, body) =>
                  setEditingProfilePostBodies((current) => ({ ...current, [postId]: body }))
                }
                onCancelPostEdit={(postId) => {
                  setEditingProfilePostId(null);
                  setEditingProfilePostBodies((current) => {
                    const next = { ...current };
                    delete next[postId];
                    return next;
                  });
                }}
                onSavePostEdit={saveProfilePostEdit}
                onToggleComment={(postId) =>
                  setActiveProfileCommentPostId((current) => current === postId ? null : postId)
                }
                onCommentBodyChange={(postId, body) =>
                  setProfilePostCommentBodies((current) => ({ ...current, [postId]: body }))
                }
                onSubmitComment={submitProfilePostComment}
                emptyTitle={t("profile.public.mediaEmptyTitle")}
              />
            )}
            {activeProfileTab === "logs" && <TopLogsCard logs={topLogs} embedded />}
            {activeProfileTab === "training" && (
              <TrainingTab
                trainingGoal={visibleProfile?.trainingGoal}
                favoriteLift={visibleProfile?.favoriteLift}
                trainingSummary={trainingSummary}
                templates={workoutTemplates}
                ownerView
                openTemplateMenuId={openWorkoutTemplateMenuId}
                editingTemplateId={editingWorkoutTemplateId}
                templateDrafts={workoutTemplateDrafts}
                onOpenTemplateMenu={setOpenWorkoutTemplateMenuId}
                onEditTemplate={editWorkoutTemplate}
                onDeleteTemplate={(templateId) => {
                  setOpenWorkoutTemplateMenuId(null);
                  setPendingWorkoutTemplateDelete(templateId);
                }}
                onTemplateDraftChange={(templateId, draft) =>
                  setWorkoutTemplateDrafts((current) => ({
                    ...current,
                    [templateId]: { ...current[templateId], ...draft },
                  }))
                }
                onCancelTemplateEdit={cancelWorkoutTemplateEdit}
                onSaveTemplateEdit={saveWorkoutTemplateEdit}
              />
            )}
            <div className="hidden">
              {visibleProfile?.heightCm && <QuickStat label="Größe" value={`${visibleProfile.heightCm} cm`} />}
              {visibleProfile?.weightKg && <QuickStat label="Gewicht" value={`${visibleProfile.weightKg} kg`} />}
              {visibleProfile?.birthDate && (
                <QuickStat label="Geburtsdatum" value={new Date(visibleProfile.birthDate).toLocaleDateString(locale)} />
              )}
              {publicPreview?.trainingSummary && (
                <>
                  <QuickStat label="Workouts" value={String(publicPreview.trainingSummary.completedWorkouts)} />
                  <QuickStat label="Sets" value={String(publicPreview.trainingSummary.totalSets)} />
                  <QuickStat label="Frequenz" value={`${publicPreview.trainingSummary.averageWorkoutsPerWeek}/Woche`} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(pendingProfilePostDelete)} onOpenChange={(open) => !open && setPendingProfilePostDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("profile.misc.deletePostTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("profile.misc.deletePostCopy")}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPendingProfilePostDelete(null)}>
                {t("profile.misc.cancel")}
              </Button>
              <Button type="button" variant="destructive" onClick={confirmProfilePostDelete}>
                {t("profile.misc.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(pendingWorkoutTemplateDelete)} onOpenChange={(open) => !open && setPendingWorkoutTemplateDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("profile.misc.deletePlaylistTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("profile.misc.deletePlaylistCopy")}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPendingWorkoutTemplateDelete(null)}>
                {t("profile.misc.cancel")}
              </Button>
              <Button type="button" variant="destructive" onClick={confirmWorkoutTemplateDelete}>
                {t("profile.misc.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {userId && (
          <FollowDialog
            open={followDialogOpen}
            onOpenChange={setFollowDialogOpen}
            graph={followGraph}
            viewerId={userId}
            profileUserId={userId}
            onFollowToggle={toggleFollow}
          />
        )}

        <Dialog
          open={editProfileOpen}
          onOpenChange={(open) => {
            setEditProfileOpen(open);
            if (!open) {
              setProfileEditMode("edit");
              setProfileEditSection("details");
            }
          }}
        >
          <DialogContent showCloseButton={false} className="z-[100] h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] overflow-hidden rounded-none border-border bg-background p-0 text-foreground shadow-2xl sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-4xl sm:rounded-xl">
            <div className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden sm:max-h-[92vh]">
              <div
                className={cn(
                  "relative overflow-visible bg-muted bg-cover bg-center",
                  profileEditMode === "preview" ? "min-h-[28.5rem] sm:min-h-[32rem]" : "min-h-[17rem] sm:min-h-52",
                )}
                style={profileCoverStyle}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    profileEditMode === "preview"
                      ? "bg-gradient-to-b from-background/20 via-background/55 to-background"
                      : "bg-gradient-to-b from-background/10 via-background/45 to-background",
                  )}
                />
                {profileEditMode === "edit" && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-3 top-3 z-30 rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-muted sm:right-4 sm:top-4"
                    aria-label={t("profile.misc.closeEditor")}
                    onClick={closeProfileEditor}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {profileEditMode === "preview" && (
                  <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between sm:left-7 sm:right-7 sm:top-6">
                    <Button size="icon" variant="ghost" className="size-9 rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-muted sm:size-11" aria-label={t("profile.misc.back")} onClick={() => setProfileEditMode("edit")}>
                      <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <ProfileHeaderActions
                      unreadTotal={unreadTotal}
                      onShare={shareProfile}
                      onOpenMessages={() => setMessagesDialogOpen(true)}
                      onOpenNetwork={() => setNetworkDialogOpen(true)}
                    />
                  </div>
                )}
                {profileEditMode === "edit" && (
                <DialogHeader className="relative z-10 flex-col items-start gap-3 space-y-0 p-4 pr-12 sm:flex-row sm:justify-between sm:p-7">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl font-black text-foreground sm:text-3xl">{t("profile.edit.title")}</DialogTitle>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                      {t("profile.edit.copy")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:pr-8">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 max-w-full rounded-full px-2.5 text-xs sm:h-9"
                      disabled={uploading === "cover"}
                      onClick={() => coverFileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {uploading === "cover" ? t("profile.misc.upload") : t("profile.misc.cover")}
                    </Button>
                    {displayCoverUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 max-w-full rounded-full px-2.5 text-xs sm:h-9"
                        onClick={() => removeProfileImage("cover")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("profile.misc.removeCover")}
                      </Button>
                    )}
                  </div>
                </DialogHeader>
                )}
                <div
                  className={cn(
                    "relative z-10 grid items-end",
                    profileEditMode === "preview"
                      ? "absolute inset-x-0 bottom-0 grid-cols-[6.25rem_minmax(0,1fr)] gap-5 px-5 pb-6 min-[390px]:gap-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8 sm:px-9 sm:pb-8"
                      : "grid-cols-[4.5rem_minmax(0,1fr)] gap-3 px-4 pb-4 pt-16 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4 sm:px-7 sm:pb-5 sm:pt-0",
                  )}
                >
                  <div className={cn("relative", profileEditMode === "preview" && "size-24 self-start min-[390px]:size-28 sm:size-44")}>
                    {profileEditMode === "preview" && <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/20 blur-2xl" />}
                    <button
                      type="button"
                      className={cn("block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", profileEditMode === "preview" && "relative")}
                      aria-label={t("profile.misc.editAvatar")}
                      onClick={() => profileEditMode === "edit" && setAvatarMenuOpen((open) => !open)}
                    >
                      <Avatar name={form.name} avatarUrl={displayAvatarUrl} size="hero" />
                    </button>
                    {profileEditMode === "edit" && avatarMenuOpen && (
                      <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 min-w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-2xl shadow-black/20">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                          onClick={() => avatarFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {t("profile.misc.uploadImage")}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10"
                          onClick={() => removeProfileImage("avatar")}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("profile.misc.removeCurrentImage")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    {profileEditMode === "preview" && (
                      <Badge className="mb-2 rounded-full px-2.5 py-0.5 text-[0.68rem] shadow-lg sm:mb-4 sm:px-4 sm:py-1 sm:text-sm">
                        {form.isPublic ? t("profile.status.public") : t("profile.status.private")}
                      </Badge>
                    )}
                    {profileEditMode === "preview" ? (
                      <h1 className="flex min-w-0 items-center gap-2 text-[2rem] font-black leading-none tracking-normal min-[390px]:text-[2.25rem] sm:text-6xl">
                        <span className="truncate">{form.name || "Steffen"}</span>
                        <BadgeCheck className="h-7 w-7 shrink-0 fill-primary text-primary-foreground sm:h-10 sm:w-10" />
                      </h1>
                    ) : (
                      <h2 className="truncate text-2xl font-black leading-none sm:text-5xl">
                        {form.name || "GymLogs User"}
                      </h2>
                    )}
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                      <p className={cn("truncate text-muted-foreground", profileEditMode === "preview" ? "text-[1.12rem] min-[390px]:text-[1.25rem] sm:text-2xl" : "text-sm sm:text-lg")}>
                        @{form.username || "username"}
                      </p>
                    </div>
                    {profileEditMode === "preview" && (
                      <>
                        <p className="mt-4 max-w-[34rem] whitespace-pre-wrap text-[1rem] font-semibold leading-[1.35] text-foreground min-[390px]:text-[1.08rem] sm:mt-8 sm:text-3xl">
                          {previewVisibleProfile.bio || t("profile.misc.emptyPublicBio")}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[0.85rem] text-muted-foreground min-[390px]:text-[0.95rem] sm:mt-8 sm:gap-x-8 sm:text-xl">
                          {previewMeta.map((meta) => {
                            const Icon = meta.icon;
                            return (
                              <span key={meta.value} className="inline-flex items-center gap-2 sm:gap-3">
                                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                                {meta.value}
                              </span>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading === "avatar"}
                  onChange={(event) => uploadProfileImage(event.target.files?.[0], "avatar")}
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading === "cover"}
                  onChange={(event) => uploadProfileImage(event.target.files?.[0], "cover")}
                />
              </div>

              <div
                className={cn(
                  "w-full max-w-full space-y-4",
                  profileEditMode === "preview"
                    ? "px-5 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] sm:px-9 sm:pb-7"
                    : "px-4 pb-[calc(env(safe-area-inset-bottom)+7.75rem)] sm:px-7 sm:pb-7",
                )}
              >
                {profileEditMode === "edit" && (
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
                    {([
                      { id: "details", label: t("profile.edit.detailsTab"), icon: User },
                      { id: "visibility", label: t("profile.edit.visibilityTab"), icon: Eye },
                    ] satisfies Array<{ id: ProfileEditSection; label: string; icon: ComponentType<{ className?: string }> }>).map((item) => {
                      const Icon = item.icon;
                      const selected = profileEditSection === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          aria-pressed={selected}
                          onClick={() => setProfileEditSection(item.id)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {profileEditMode === "preview" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2.5 sm:max-w-xl sm:gap-3">
                      {form.allowMessages && (
                        <Button type="button" className="h-12 rounded-lg text-base font-semibold sm:h-14 sm:text-lg">
                          {t("profile.misc.message")}
                        </Button>
                      )}
                      <Button type="button" variant="outline" className="h-12 rounded-lg text-base font-semibold sm:h-14 sm:text-lg">
                        {t("profile.misc.addFriend")}
                      </Button>
                    </div>
                    <div className="hidden">
                      <p className="whitespace-pre-wrap text-lg font-semibold leading-7 text-white">
                        {form.bio || t("profile.misc.emptyBio")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/62">
                        {form.location && <Badge variant="secondary" className="bg-white/10 text-white"><MapPin className="h-3 w-3" />{form.location}</Badge>}
                        {form.favoriteLift && <Badge variant="secondary" className="bg-white/10 text-white"><Dumbbell className="h-3 w-3" />{form.favoriteLift}</Badge>}
                        {form.heightCm && <Badge variant="secondary" className="bg-white/10 text-white"><Ruler className="h-3 w-3" />{form.heightCm} cm</Badge>}
                      </div>
                    </div>
                    {previewTrainingSummary && hasVisiblePreviewMetric && (
                      <div
                        className={cn(
                        "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-muted/20 shadow-sm",
                          previewMetricItems.length > 2 && "min-[420px]:grid-cols-4"
                        )}
                      >
                        {previewMetricItems.map((metric) => (
                          <ProfileMetric
                            key={metric.key}
                            icon={metric.icon}
                            iconClassName={metric.iconClassName}
                            value={metric.value}
                            label={metric.label}
                            detail={metric.detail}
                          />
                        ))}
                      </div>
                    )}
                    {!form.isPublic && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                        {t("profile.misc.privatePreview")}
                      </div>
                    )}
                    {form.isPublic && (
                      <>
                        <div className="-mx-5 overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">
                          <div className="flex w-max min-w-full gap-3 sm:gap-7">
                            {previewTabs.map((tab) => (
                              <button
                                key={tab.id}
                                ref={(node) => {
                                  previewTabRefs.current[tab.id] = node;
                                }}
                                type="button"
                                onClick={() => setPreviewProfileTab(tab.id)}
                                className={cn(
                                  "relative min-h-12 shrink-0 whitespace-nowrap px-1.5 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-14 sm:px-1 sm:text-xl",
                                  previewProfileTab === tab.id && "text-foreground"
                                )}
                              >
                                {tab.label}
                                {previewProfileTab === tab.id && (
                                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        {previewProfileTab === "posts" && (
                          <ProfilePostsCard
                            posts={posts}
                            profileName={form.name || "GymLogs User"}
                            username={form.username || "username"}
                            avatarUrl={displayAvatarUrl}
                            isPro={Boolean(user?.isPro)}
                            userId={null}
                            canManagePosts={false}
                            commentBodies={{}}
                            activeCommentPostId={null}
                            activeThread={null}
                            openPostMenuId={null}
                            editingPostId={null}
                            editingPostBodies={{}}
                            onLike={() => undefined}
                            onSave={() => undefined}
                            onRepost={() => undefined}
                            onOpenPostMenu={() => undefined}
                            onEditPost={() => undefined}
                            onDeletePost={() => undefined}
                            onEditingPostBodyChange={() => undefined}
                            onCancelPostEdit={() => undefined}
                            onSavePostEdit={() => undefined}
                            onToggleComment={() => undefined}
                            onCommentBodyChange={() => undefined}
                            onSubmitComment={() => undefined}
                          />
                        )}
                        {previewProfileTab === "media" && (
                          <ProfilePostsCard
                            posts={mediaPosts}
                            profileName={form.name || "GymLogs User"}
                            username={form.username || "username"}
                            avatarUrl={displayAvatarUrl}
                            isPro={Boolean(user?.isPro)}
                            userId={null}
                            canManagePosts={false}
                            commentBodies={{}}
                            activeCommentPostId={null}
                            activeThread={null}
                            openPostMenuId={null}
                            editingPostId={null}
                            editingPostBodies={{}}
                            onLike={() => undefined}
                            onSave={() => undefined}
                            onRepost={() => undefined}
                            onOpenPostMenu={() => undefined}
                            onEditPost={() => undefined}
                            onDeletePost={() => undefined}
                            onEditingPostBodyChange={() => undefined}
                            onCancelPostEdit={() => undefined}
                            onSavePostEdit={() => undefined}
                            onToggleComment={() => undefined}
                            onCommentBodyChange={() => undefined}
                            onSubmitComment={() => undefined}
                            emptyTitle={t("profile.public.mediaEmptyTitle")}
                          />
                        )}
                        {previewProfileTab === "logs" && <TopLogsCard logs={topLogs} embedded />}
                        {previewProfileTab === "training" && (
                          <TrainingTab
                            trainingGoal={previewVisibleProfile.trainingGoal}
                            favoriteLift={previewVisibleProfile.favoriteLift}
                            trainingSummary={previewTrainingSummary}
                            templates={previewTemplates}
                            ownerView={false}
                            openTemplateMenuId={null}
                            editingTemplateId={null}
                            templateDrafts={{}}
                            onOpenTemplateMenu={() => undefined}
                            onEditTemplate={() => undefined}
                            onDeleteTemplate={() => undefined}
                            onTemplateDraftChange={() => undefined}
                            onCancelTemplateEdit={() => undefined}
                            onSaveTemplateEdit={() => undefined}
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : profileEditSection === "details" ? (
                  <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="min-w-0 max-w-full space-y-4">
                      <section className="grid min-w-0 max-w-full gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 sm:grid-cols-2 sm:p-4">
                        <div className="sm:col-span-2">
                          <p className="font-semibold">{t("profile.edit.detailsTitle")}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("profile.edit.detailsCopy")}</p>
                        </div>
                        <Field label={t("profile.fields.name")}>
                          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                        </Field>
                        <Field label={t("profile.fields.username")}>
                          <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                        </Field>
                        <Field label={t("profile.fields.location")}>
                          <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                        </Field>
                        <Field label={t("profile.fields.favoriteLift")}>
                          <Input
                            list="favorite-lift-options"
                            value={form.favoriteLift}
                            placeholder={t("profile.fields.favoriteLiftPlaceholder")}
                            onChange={(event) => setForm({ ...form, favoriteLift: event.target.value })}
                          />
                          <datalist id="favorite-lift-options">
                            {favoriteLiftOptions.map((exerciseName) => (
                              <option key={exerciseName} value={exerciseName} />
                            ))}
                          </datalist>
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label={t("profile.fields.bio")}>
                            <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} maxLength={180} />
                          </Field>
                        </div>
                        <div className="sm:col-span-2">
                          <Field label={t("profile.fields.trainingGoal")}>
                            <Textarea value={form.trainingGoal} onChange={(event) => setForm({ ...form, trainingGoal: event.target.value })} rows={2} maxLength={120} />
                          </Field>
                        </div>
                      </section>

                      <section className="grid min-w-0 max-w-full gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 sm:grid-cols-2 sm:p-4">
                        <div className="sm:col-span-2">
                          <p className="font-semibold">{t("profile.edit.mediaTitle")}</p>
                        </div>
                        <Field label={t("profile.fields.avatarUrl")}>
                          <Input placeholder="https://..." value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value, avatarStorageId: undefined })} />
                        </Field>
                        <Field label={t("profile.fields.coverUrl")}>
                          <Input placeholder="https://..." value={form.coverUrl} onChange={(event) => setForm({ ...form, coverUrl: event.target.value, coverStorageId: undefined })} />
                        </Field>
                      </section>
                    </div>

                    <section className="grid min-w-0 max-w-full content-start gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 sm:p-4">
                      <p className="font-semibold">{t("profile.edit.bodyTitle")}</p>
                      <Field label={t("profile.fields.heightCm")}>
                        <Input inputMode="decimal" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} />
                      </Field>
                      <Field label={t("profile.fields.weightKg")}>
                        <Input inputMode="decimal" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} />
                      </Field>
                      <Field label={t("profile.fields.birthDate")}>
                        <Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
                      </Field>
                    </section>
                  </div>
                ) : (
                  <div className="mx-auto grid w-full max-w-2xl gap-3">
                    <section className="grid min-w-0 max-w-full gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 sm:p-4">
                      <div>
                        <p className="font-semibold">{t("profile.edit.visibilityTitle")}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("profile.edit.visibilityCopy")}</p>
                      </div>
                      <ProfileVisibilitySelect value={form.isPublic ? "public" : "private"} onChange={(value) => setForm({ ...form, isPublic: value === "public" })} />
                      <PrivacyToggle label={t("profile.fields.allowMessages")} checked={form.allowMessages} onChange={(checked) => setForm({ ...form, allowMessages: checked })} />
                    </section>

                    <section className="rounded-lg border border-border bg-card p-3 text-sm sm:p-4">
                      <p className="font-medium">{t("profile.edit.fieldVisibilityTitle")}</p>
                      <div className="mt-3 grid gap-2">
                        <PrivacyToggle label={t("profile.fields.bio")} checked={form.publicBio} onChange={(checked) => setForm({ ...form, publicBio: checked })} />
                        <PrivacyToggle label={t("profile.fields.location")} checked={form.publicLocation} onChange={(checked) => setForm({ ...form, publicLocation: checked })} />
                        <PrivacyToggle label={t("profile.fields.favoriteLift")} checked={form.publicFavoriteLift} onChange={(checked) => setForm({ ...form, publicFavoriteLift: checked })} />
                        <PrivacyToggle label={t("profile.fields.trainingGoal")} checked={form.publicTrainingGoal} onChange={(checked) => setForm({ ...form, publicTrainingGoal: checked })} />
                        <PrivacyToggle label={t("profile.fields.heightCm")} checked={form.publicHeight} onChange={(checked) => setForm({ ...form, publicHeight: checked })} />
                        <PrivacyToggle label={t("profile.fields.weightKg")} checked={form.publicWeight} onChange={(checked) => setForm({ ...form, publicWeight: checked })} />
                        <PrivacyToggle label={t("profile.fields.birthDate")} checked={form.publicBirthDate} onChange={(checked) => setForm({ ...form, publicBirthDate: checked })} />
                      </div>
                    </section>

                    <section className="rounded-lg border border-border bg-card p-3 text-sm sm:p-4">
                      <p className="font-medium">{t("profile.edit.trainingStatsTitle")}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("profile.edit.trainingStatsCopy")}
                      </p>
                      <div className="mt-3 grid gap-2">
                        <PrivacyToggle label={t("profile.fields.streak")} description={t("profile.trainingVisibility.streakCopy")} checked={form.publicTrainingStreak} onChange={(checked) => setForm({ ...form, showTrainingSummary: true, publicTrainingStreak: checked })} />
                        <PrivacyToggle label={t("profile.metrics.topLift")} description={t("profile.trainingVisibility.topLiftCopy")} checked={form.publicTrainingBestSet} onChange={(checked) => setForm({ ...form, showTrainingSummary: true, publicTrainingBestSet: checked })} />
                        <PrivacyToggle label={t("profile.fields.activityPerWeek")} description={t("profile.trainingVisibility.activityCopy")} checked={form.publicTrainingActivity} onChange={(checked) => setForm({ ...form, showTrainingSummary: true, publicTrainingActivity: checked })} />
                        <PrivacyToggle label={t("profile.fields.volume")} description={t("profile.trainingVisibility.volumeCopy")} checked={form.publicTrainingVolume} onChange={(checked) => setForm({ ...form, showTrainingSummary: true, publicTrainingVolume: checked })} />
                      </div>
                    </section>

                    <section className="rounded-lg border border-border bg-card p-3 text-sm sm:p-4">
                      <p className="font-medium">{t("profile.edit.otherTrainingTitle")}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("profile.edit.otherTrainingCopy")}
                      </p>
                    </section>
                  </div>
                )}

                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                <div className="fixed inset-x-0 bottom-0 z-[110] flex flex-col gap-2 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:sticky sm:-mx-7 sm:flex-row sm:items-center sm:justify-end sm:px-7 sm:py-4">
                  <Button type="button" variant="outline" onClick={() => setProfileEditMode((mode) => mode === "preview" ? "edit" : "preview")}>
                    <Eye className="h-4 w-4" />
                    {profileEditMode === "preview" ? t("profile.edit.backToEdit") : t("profile.edit.preview")}
                  </Button>
                  <Button onClick={saveProfile}>{t("profile.edit.save")}</Button>
                  {saved && <span className="self-center text-sm text-emerald-400">{t("profile.edit.saved")}</span>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        <Dialog open={messagesDialogOpen} onOpenChange={setMessagesDialogOpen}>
          <DialogContent className="z-[100] h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] overflow-hidden rounded-none border-[#1c2b2f] bg-[#05090a] p-0 text-foreground shadow-2xl shadow-black/70 sm:h-[92dvh] sm:max-w-[460px] sm:rounded-[28px]">
            <div id="messages" className="grid h-full min-h-0 bg-[#05090a]">
              <aside className={cn("min-h-0 bg-[#071012]", thread ? "hidden" : "flex flex-col")}>
                <div className="shrink-0 border-b border-white/[0.07] px-4 pb-3 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-extrabold tracking-normal">{t("profile.messagesPanel.title")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {unreadTotal > 0 ? `${unreadTotal} ${t("profile.messagesPanel.unread")}` : t("profile.messagesPanel.emptyTitle")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-full text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                      aria-label={t("profile.networkPanel.newMessage")}
                      onClick={() => {
                        setMessagesDialogOpen(false);
                        setNetworkDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <label className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-white/[0.08] px-3 text-sm text-muted-foreground shadow-inner shadow-black/20 focus-within:ring-1 focus-within:ring-primary/45">
                    <Search className="h-4 w-4" />
                    <input
                      value={messageSearch}
                      onChange={(event) => setMessageSearch(event.target.value)}
                      placeholder="Suchen"
                      className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    {messageSearch && (
                      <button
                        type="button"
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                        onClick={() => setMessageSearch("")}
                        aria-label="Suche leeren"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </label>
                  <div className="mt-3 grid grid-cols-4 gap-1 text-[0.65rem] font-semibold">
                    {([
                      { id: "all" as const, label: "Alle" },
                      { id: "messages" as const, label: "Nachrichten" },
                      { id: "comments" as const, label: "Kommentare" },
                      { id: "mentions" as const, label: "Mentions" },
                    ]).map(({ id, label }) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={messageInboxFilter === id}
                        onClick={() => setMessageInboxFilter(id)}
                        className={cn(
                          "h-8 rounded-full border px-1 transition",
                          messageInboxFilter === id
                            ? "border-primary/55 bg-primary/18 text-primary"
                            : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="block truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
                  {conversations === undefined ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">{t("profile.messagesPanel.loading")}</p>
                  ) : visibleConversations.length === 0 ? (
                    <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-white/15">
                        <Send className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-semibold">
                        {messageSearch || messageInboxFilter !== "all"
                          ? "Nichts gefunden"
                          : t("profile.messagesPanel.emptyTitle")}
                      </p>
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">
                        {messageSearch || messageInboxFilter !== "all"
                          ? "Passe Suche oder Filter an."
                          : t("profile.messagesPanel.emptyCopy")}
                      </p>
                    </div>
                  ) : (
                    visibleConversations.map((conversation) => (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => setActiveConversation(conversation._id)}
                        className={cn(
                          "group grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.35rem] px-1.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          activeConversation === conversation._id
                            ? "bg-white/[0.12]"
                            : "hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar name={conversation.otherUser?.name ?? "?"} avatarUrl={conversation.otherUser?.avatarUrl} />
                          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#071012] bg-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className="flex min-w-0 items-center gap-1 truncate font-semibold">
                              <span className="truncate">{conversation.otherUser?.name ?? t("profile.messagesPanel.unknownUser")}</span>
                              {conversation.otherUser?.isPro && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />}
                            </p>
                          </div>
                          <p className={cn("mt-0.5 truncate text-sm leading-5", conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                            {conversation.lastMessagePreview ?? t("profile.messagesPanel.newConversation")}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <time className="text-[0.68rem] leading-none text-muted-foreground">{formatMessageTime(conversation.updatedAt)}</time>
                          {conversation.unreadCount > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[0.65rem] font-bold leading-5 text-primary-foreground">{conversation.unreadCount}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </aside>

              <section className={cn("min-h-0 flex-col bg-[#05090a]", thread ? "flex" : "hidden")}>
                {!thread ? (
                  <div className="flex h-full min-h-0 flex-col items-center justify-center px-8 text-center">
                    <div className="mb-5 flex size-24 items-center justify-center rounded-full border border-white/20">
                      <Send className="h-10 w-10 text-foreground" />
                    </div>
                    <p className="text-xl font-semibold">{t("profile.messagesPanel.emptyTitle")}</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{t("profile.messagesPanel.selectThread")}</p>
                    <Button
                      type="button"
                      className="mt-5"
                      onClick={() => {
                        setMessagesDialogOpen(false);
                        setNetworkDialogOpen(true);
                      }}
                    >
                      {t("profile.networkPanel.newMessage")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex h-24 shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#071012]/95 px-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur">
                      <div className="flex min-w-0 items-center gap-3">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="size-9 shrink-0 rounded-full text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                          aria-label={t("profile.messagesPanel.closeThread")}
                          title={t("profile.messagesPanel.closeThread")}
                          onClick={() => {
                            setActiveConversation(null);
                            setReportedMessage(null);
                            clearMessageImageDraft();
                          }}
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="relative">
                          <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} size="chat" />
                          <span className="absolute bottom-1 right-0 size-4 rounded-full border-[3px] border-[#071012] bg-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="flex min-w-0 items-center gap-1.5 truncate text-xl font-extrabold leading-6">
                            <span className="truncate">{thread.otherUser?.name ?? t("profile.messagesPanel.unknownUser")}</span>
                            {thread.otherUser?.isPro && <BadgeCheck className="h-5 w-5 shrink-0 fill-primary text-black" />}
                          </p>
                          <p className="truncate text-base leading-5 text-muted-foreground">online</p>
                        </div>
                      </div>
                      {thread.otherUser && (
                        <div className="relative flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="hidden size-11 rounded-full border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground min-[400px]:inline-flex"
                            aria-label="Anruf starten"
                            title="Anruf starten"
                          >
                            <Phone className="h-5 w-5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="hidden size-11 rounded-full border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground min-[400px]:inline-flex"
                            aria-label="Videoanruf starten"
                            title="Videoanruf starten"
                          >
                            <Video className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="size-11 rounded-full border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                            aria-label="Chat Optionen"
                            aria-haspopup="menu"
                            aria-expanded={messageThreadMenuOpen}
                            onClick={() => setMessageThreadMenuOpen((open) => !open)}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                          {messageThreadMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101619] p-1.5 text-sm shadow-2xl shadow-black/40"
                            >
                              <Link
                                role="menuitem"
                                href={`/profile/${thread.otherUser._id}`}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground transition hover:bg-white/[0.08]"
                                onClick={() => {
                                  setMessageThreadMenuOpen(false);
                                  setMessagesDialogOpen(false);
                                }}
                              >
                                <User className="h-4 w-4 text-primary" />
                                Profil ansehen
                              </Link>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground transition hover:bg-white/[0.08]"
                                onClick={() => {
                                  if (!userId || !thread.otherUser) return;
                                  void (thread.isBlocked
                                    ? unblockUser({ blockerId: userId, blockedId: thread.otherUser._id })
                                    : blockUser({ blockerId: userId, blockedId: thread.otherUser._id }));
                                  setMessageThreadMenuOpen(false);
                                }}
                              >
                                <Ban className="h-4 w-4 text-primary" />
                                {thread.isBlocked ? t("profile.messagesPanel.unblock") : t("profile.messagesPanel.block")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      ref={messagesScrollRef}
                      onScroll={handleMessagesScroll}
                      className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_30%_12%,rgba(255,143,0,0.08),transparent_19rem),radial-gradient(circle_at_90%_40%,rgba(255,143,0,0.045),transparent_20rem)] px-5 py-5 font-[var(--font-outfit)]"
                    >
                      {showJumpToLatest && (
                        <button
                          type="button"
                          className="sticky top-3 z-10 mx-auto mb-3 flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-[#171b20]/95 px-3 text-xs font-semibold text-foreground shadow-lg shadow-black/25 backdrop-blur transition hover:bg-[#20252c]"
                          onClick={() => {
                            latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                            setShowJumpToLatest(false);
                          }}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          {t("profile.messagesPanel.jumpToLatest")}
                        </button>
                      )}
                      <div className="mb-5 mt-1 text-center text-base font-bold text-muted-foreground">Heute</div>
                      <div className="space-y-5">
                        {thread.messages.map((message, index) => {
                          const mine = message.senderId === userId;
                          const isPostShare = message.type === "post_share";
                          const isLatest = index === thread.messages.length - 1;
                          return (
                            <div key={message._id} ref={isLatest ? latestMessageRef : undefined} className={cn("flex items-end gap-3", mine ? "justify-end" : "justify-start")}>
                              {!mine && !isPostShare && (
                                <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} size="sm" />
                              )}
                              <div className={cn("min-w-0", isPostShare ? "max-w-[18.5rem] min-[420px]:max-w-[21rem]" : "max-w-[78%]", mine ? "items-end" : "items-start")}>
                                <div
                                  className={cn(
                                    "text-sm",
                                    isPostShare
                                      ? "p-0"
                                      : cn(
                                          "rounded-[1.35rem] px-4 py-3 shadow-sm",
                                          mine
                                            ? "rounded-br-md bg-primary text-[1.05rem] font-medium leading-7 text-primary-foreground shadow-[0_18px_42px_rgba(255,132,0,0.16)]"
                                            : "rounded-bl-md bg-[#1b2225] text-[1.05rem] leading-7 text-foreground shadow-[0_18px_42px_rgba(0,0,0,0.18)]"
                                        )
                                  )}
                                >
                                  {isPostShare ? (
                                    <PostShareCard message={message} mine={mine} />
                                  ) : message.type === "image" ? (
                                    <ImageMessage message={message} />
                                  ) : (
                                    <p className="whitespace-pre-wrap break-words leading-6">{message.body}</p>
                                  )}
                                </div>
                                <div className={cn("mt-1 flex items-center gap-2 px-1 text-[0.65rem] leading-none text-muted-foreground/75", mine ? "justify-end" : "justify-start")}>
                                  <span>{new Date(message.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                                  {mine ? (
                                    <span>{message.readAt ? t("profile.messagesPanel.read") : t("profile.messagesPanel.unreadStatus")}</span>
                                  ) : (
                                    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setReportedMessage(message._id)}>
                                      <Flag className="h-3 w-3" />
                                      {t("profile.messagesPanel.report")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {reportedMessage && (
                      <div className="shrink-0 border-t border-white/10 bg-[#0d1013] p-3">
                        <Label>{t("profile.messagesPanel.reportReason")}</Label>
                        <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="destructive" onClick={submitReport}>{t("profile.messagesPanel.report")}</Button>
                          <Button size="sm" variant="outline" onClick={() => setReportedMessage(null)}>{t("profile.messagesPanel.cancel")}</Button>
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 border-t border-white/[0.07] bg-[#071012]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-16px_40px_rgba(0,0,0,0.32)] backdrop-blur">
                      {messageImageDraft && (
                        <div className="mb-3 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={messageImageDraft.url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{messageImageDraft.name}</p>
                            <p className="text-xs text-muted-foreground">{t("profile.messagesPanel.sendImageHint")}</p>
                          </div>
                          <Button type="button" size="icon-sm" variant="ghost" aria-label={t("profile.messagesPanel.removeImage")} onClick={clearMessageImageDraft}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {messageUploadError && <p className="mb-2 text-xs text-destructive">{messageUploadError}</p>}
                      <div className="flex items-center gap-2">
                        <label
                          className={cn(
                            "inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.13] hover:text-foreground",
                            (thread.isBlocked || uploadingMessageImage) && "pointer-events-none opacity-50"
                          )}
                          aria-label={t("profile.messagesPanel.sendImage")}
                          title={t("profile.messagesPanel.sendImage")}
                        >
                          <Paperclip className="h-6 w-6" />
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={thread.isBlocked || uploadingMessageImage}
                            onChange={(event) => uploadMessageImage(event.target.files?.[0])}
                          />
                        </label>
                        <Input
                          value={messageBody}
                          disabled={thread.isBlocked}
                          placeholder={thread.isBlocked ? t("profile.messagesPanel.blockedPlaceholder") : t("profile.messagesPanel.inputPlaceholder")}
                          onChange={(event) => setMessageBody(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void submitMessage();
                            }
                          }}
                          maxLength={600}
                          className="h-14 rounded-full border-white/[0.08] bg-white/[0.08] px-5 text-base shadow-inner shadow-black/20 placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary/45"
                        />
                        <Button size="icon" className="size-14 shrink-0 rounded-full shadow-[0_18px_42px_rgba(255,132,0,0.24)]" disabled={thread.isBlocked || (!messageBody.trim() && !messageImageDraft)} onClick={() => submitMessage()}>
                          <Send className="h-6 w-6" />
                        </Button>
                      </div>
                      <p className="sr-only">
                        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
                        {t("profile.messagesPanel.spamNotice")}
                      </p>
                    </div>
                  </>
                )}
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={networkDialogOpen} onOpenChange={setNetworkDialogOpen}>
        <DialogContent className="z-[100] h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] overflow-y-auto rounded-none border-border bg-background p-4 sm:h-auto sm:max-h-[90dvh] sm:max-w-3xl sm:rounded-xl sm:p-6">
      <aside
        id="network"
        className="space-y-5"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {t("profile.networkPanel.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>{t("profile.networkPanel.addByUsername")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="username"
                  value={friendUsername}
                  onChange={(event) => setFriendUsername(event.target.value)}
                />
                <Button
                  size="icon"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={async () => {
                    if (!userId || !friendUsername.trim()) return;
                    setFriendError("");
                    try {
                      await addFriend({ userId, username: friendUsername });
                      setFriendUsername("");
                    } catch (error) {
                      setFriendError(error instanceof Error ? error.message : t("profile.networkPanel.addError"));
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              {friendError && <p className="text-xs text-destructive">{friendError}</p>}
            </div>
            <div className="space-y-2">
              {friends === undefined ? (
                <p className="text-sm text-muted-foreground">{t("profile.networkPanel.loading")}</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("profile.networkPanel.empty")}</p>
              ) : (
                friends.map((entry) =>
                  entry.friend ? (
                    <div key={entry.friendshipId} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/35">
                      <Avatar name={entry.friend.name} avatarUrl={entry.friend.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${entry.friend._id}`} className="flex items-center gap-1 truncate text-sm font-medium hover:underline">
                          {entry.friend.name}
                          {entry.friend.isPro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">@{entry.friend.username}</p>
                      </div>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => userId && removeFriend({ userId, friendId: entry.friend!._id })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              {t("profile.networkPanel.findUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder={t("profile.networkPanel.searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="space-y-2">
              {searchResults?.map((result) => (
                <div key={result._id} className="rounded-2xl border border-border bg-muted/20 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/35">
                  <div className="flex items-center gap-3">
                <Avatar name={result.name} avatarUrl={result.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile/${result._id}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                        {result.name}
                        {result.isPro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{result.username}</p>
                    </div>
                  </div>
                  {result.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{result.bio}</p>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    disabled={!result.allowMessages}
                    onClick={() => setMessageTarget(result._id)}
                  >
                    {result.allowMessages ? <Send className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {t("profile.networkPanel.message")}
                  </Button>
                </div>
              ))}
            </div>
            {messageTarget && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Label>{t("profile.networkPanel.newMessage")}</Label>
                <Textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={3} maxLength={600} />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => submitMessage(messageTarget)}>{t("profile.networkPanel.send")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setMessageTarget(null)}>{t("profile.networkPanel.cancel")}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </aside>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfilePostComposer({
  body,
  mediaDraft,
  error,
  uploading,
  disabled,
  profileName,
  avatarUrl,
  onBodyChange,
  onFile,
  onClearMedia,
  onSubmit,
}: {
  body: string;
  mediaDraft: ProfilePostMediaDraft | null;
  error: string;
  uploading: boolean;
  disabled: boolean;
  profileName: string;
  avatarUrl?: string;
  onBodyChange: (body: string) => void;
  onFile: (file: File | undefined) => void;
  onClearMedia: () => void;
  onSubmit: () => void;
}) {
  const { t } = useAppPreferences();

  return (
    <section className="border-y border-border bg-background px-6 py-4 sm:px-8" aria-label={t("socialPage.createPost")}>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
        <Avatar name={profileName} avatarUrl={avatarUrl} />
        <div className="min-w-0 space-y-3">
          <Textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder={t("socialPage.composerPlaceholder")}
            rows={mediaDraft || body ? 2 : 1}
            maxLength={1200}
            aria-label={t("socialPage.newPost")}
            className="min-h-10 resize-none border-0 bg-transparent px-0 py-1 text-base text-white placeholder:text-white/45 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {mediaDraft && (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-xs text-white/55">
                <span className="truncate">{mediaDraft.name}</span>
                <Button type="button" size="icon-xs" variant="ghost" aria-label={t("socialPage.removeMedia")} onClick={onClearMedia}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {mediaDraft.mediaType === "video" ? (
                <video src={mediaDraft.url} controls className="max-h-72 w-full bg-black object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaDraft.url} alt="" className="max-h-72 w-full object-cover" />
              )}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white">
              <ImagePlus className="h-4 w-4" />
              <span className="sr-only">{uploading ? t("socialPage.uploadRunning") : t("socialPage.attachMedia")}</span>
              <input type="file" accept="image/*,video/*,.gif" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
            <Button type="button" size="sm" disabled={disabled} onClick={onSubmit}>
              {t("socialPage.post")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfilePostsCard({
  posts,
  profileName,
  username,
  avatarUrl,
  isPro,
  userId,
  canManagePosts,
  commentBodies,
  activeCommentPostId,
  activeThread,
  openPostMenuId,
  editingPostId,
  editingPostBodies,
  onLike,
  onSave,
  onRepost,
  onOpenPostMenu,
  onEditPost,
  onDeletePost,
  onEditingPostBodyChange,
  onCancelPostEdit,
  onSavePostEdit,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
  emptyTitle,
}: {
  posts: ProfilePost[] | undefined;
  profileName: string;
  username: string;
  avatarUrl?: string;
  isPro: boolean;
  userId: Id<"users"> | null | undefined;
  canManagePosts: boolean;
  commentBodies: Record<string, string>;
  activeCommentPostId: string | null;
  activeThread: ProfilePostThread;
  openPostMenuId: string | null;
  editingPostId: string | null;
  editingPostBodies: Record<string, string>;
  onLike: (postId: Id<"social_posts">) => void;
  onSave: (postId: Id<"social_posts">) => void;
  onRepost: (postId: Id<"social_posts">) => void;
  onOpenPostMenu: (postId: string | null) => void;
  onEditPost: (post: ProfilePost) => void;
  onDeletePost: (postId: Id<"social_posts">) => void;
  onEditingPostBodyChange: (postId: Id<"social_posts">, body: string) => void;
  onCancelPostEdit: (postId: Id<"social_posts">) => void;
  onSavePostEdit: (post: ProfilePost) => void;
  onToggleComment: (postId: Id<"social_posts">) => void;
  onCommentBodyChange: (postId: Id<"social_posts">, body: string) => void;
  onSubmitComment: (postId: Id<"social_posts">) => void;
  emptyTitle?: string;
}) {
  const { locale, t } = useAppPreferences();
  const resolvedEmptyTitle = emptyTitle ?? t("profile.public.postsEmptyTitle");
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

  if (posts === undefined) {
    return <p className="text-xl text-muted-foreground">{t("profile.public.postsLoading")}</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center border-y border-border bg-background px-6 py-8 text-center text-sm text-muted-foreground">
        {resolvedEmptyTitle}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-y border-white/10">
      {posts.map((post) => {
        const isPreviewPost = post._id === ("preview" as Id<"social_posts">);
        const commentBody = commentBodies[post._id] ?? "";
        const showCommentInput = activeCommentPostId === post._id;
        const threadForPost = showCommentInput ? activeThread : undefined;
        const isEditing = editingPostId === post._id;
        const editingBody = editingPostBodies[post._id] ?? post.body ?? "";
        const canSaveEdit = Boolean(editingBody.trim() || post.mediaUrl || post.linkedLog);
        const edited = Boolean(post.updatedAt && post.updatedAt > post.createdAt);
        const isOwnPost = Boolean(userId && post.authorId === userId);
        const canRepost = Boolean(userId && !isOwnPost && !post.repostedByViewer && !post.repostOfPostId);
        return (
        <article key={post._id} className="border-b border-border bg-background px-4 py-4 last:border-b-0 sm:px-8">
          <div className="flex items-start gap-3">
            <Avatar name={profileName} avatarUrl={avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-base font-bold text-white sm:text-lg">
                    {profileName}
                    {isPro && <BadgeCheck className="h-5 w-5 shrink-0 fill-primary text-black" />}
                    <span className="truncate text-sm font-normal text-white/45">@{username}</span>
                    <span className="text-sm font-normal text-white/45">· {formatProfilePostTime(post.createdAt, locale, t("profile.public.justNow"))}</span>
                    {edited && <span className="text-sm font-normal text-white/45">{t("profile.public.edited")}</span>}
                  </p>
                </div>
                {canManagePosts && !isPreviewPost && (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label="Post-Optionen"
                      className="rounded-md text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => onOpenPostMenu(openPostMenuId === post._id ? null : post._id)}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {openPostMenuId === post._id && (
                      <div className="premium-panel absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl p-1 text-white shadow-xl shadow-black/30">
                        <button
                          type="button"
                          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
                          onClick={() => onEditPost(post)}
                        >
                          <Pencil className="h-4 w-4" />
                          {t("profile.misc.edit")}
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                          onClick={() => onDeletePost(post._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("profile.misc.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={editingBody}
                    onChange={(event) => onEditingPostBodyChange(post._id, event.target.value)}
                    rows={3}
                    maxLength={1200}
                    className="min-h-28 border-white/10 bg-white/[0.04] text-base text-white placeholder:text-white/35 focus:border-primary sm:text-lg"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => onCancelPostEdit(post._id)}>
                      {t("profile.misc.cancel")}
                    </Button>
                    <Button type="button" disabled={!canSaveEdit} onClick={() => onSavePostEdit(post)}>
                      {t("profile.misc.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                post.body && <p className="mt-4 whitespace-pre-wrap text-base leading-6 text-white sm:text-lg">{post.body}</p>
              )}
              {post.repostOfPostId && <p className="mt-2 text-sm text-muted-foreground">reposted</p>}
              {post.linkedLog && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3 text-sm">
                  <p className="font-medium">{post.linkedLog.exerciseName ?? "Top Log"}</p>
                  <p className="text-white/55">
                    {post.linkedLog.weightKg} kg x {post.linkedLog.reps} · Score {post.linkedLog.score ?? "-"}
                  </p>
                </div>
              )}
              {post.mediaUrl && (
                <div className="mt-4 overflow-hidden rounded-lg bg-white/5">
                  {post.mediaType === "video" ? (
                    <video src={post.mediaUrl} controls className="max-h-[28rem] w-full bg-black object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.mediaUrl} alt="" className="max-h-[28rem] w-full object-cover" />
                  )}
                </div>
              )}
              <div className="mt-4 grid grid-cols-5 items-center text-sm text-white/58">
                <ProfilePostActionButton active={post.likedByViewer} activeClass="text-rose-500 hover:text-rose-500" disabled={!userId || isPreviewPost} onClick={() => onLike(post._id)} ariaLabel={post.likedByViewer ? "Like entfernen" : "Liken"}>
                  <Heart className={`h-5 w-5 ${post.likedByViewer ? "fill-current" : ""}`} />
                  <span>{post.likeCount}</span>
                </ProfilePostActionButton>
                <ProfilePostActionButton disabled={!userId || isPreviewPost} onClick={() => onToggleComment(post._id)} ariaLabel="Kommentare öffnen">
                  <MessageSquare className="h-5 w-5" />
                  <span>{post.commentCount}</span>
                </ProfilePostActionButton>
                <ProfilePostActionButton active={post.repostedByViewer} activeClass="text-primary hover:text-primary" disabled={!canRepost || isPreviewPost} onClick={() => onRepost(post._id)} ariaLabel={isOwnPost ? "Eigene Posts können nicht repostet werden" : post.repostedByViewer ? "Bereits repostet" : "Reposten"}>
                  <Repeat2 className="h-5 w-5" />
                  <span>{post.repostCount}</span>
                </ProfilePostActionButton>
                <ProfilePostActionButton active={post.savedByViewer} activeClass="text-primary hover:text-primary" disabled={!userId || isPreviewPost} onClick={() => onSave(post._id)} ariaLabel={post.savedByViewer ? t("profile.public.removeSavedPost") : t("profile.public.savePostAria")}>
                  <Bookmark className={`h-5 w-5 ${post.savedByViewer ? "fill-current" : ""}`} />
                </ProfilePostActionButton>
                <ProfilePostActionButton disabled={isPreviewPost} onClick={() => sharePost(post._id)} ariaLabel={t("profile.public.sharePost")}>
                  <Share2 className="h-5 w-5" />
                </ProfilePostActionButton>
              </div>
              {!isPreviewPost && showCommentInput && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex gap-2">
                    <input
                      id={`profile-comment-${post._id}`}
                      value={commentBody}
                      onChange={(event) => onCommentBodyChange(post._id, event.target.value)}
                      placeholder={t("profile.public.commentPlaceholder")}
                      maxLength={600}
                      className="min-h-9 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-primary"
                    />
                    <Button type="button" size="sm" disabled={!userId || !commentBody.trim()} onClick={() => onSubmitComment(post._id)}>
                      {t("profile.networkPanel.send")}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {threadForPost === undefined ? (
                      <p className="text-sm text-white/45">{t("profile.public.postsLoading")}</p>
                    ) : threadForPost === null ? (
                      <p className="text-sm text-white/45">{t("profile.public.unavailablePost")}</p>
                    ) : threadForPost.comments.length === 0 ? (
                      <p className="text-sm text-white/45">Noch keine Kommentare.</p>
                    ) : (
                      threadForPost.comments.map((comment) => (
                        <ProfileCommentPreview key={comment._id} comment={comment} postId={post._id} userId={userId} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      );
      })}
      <Link href="/social" className="flex h-16 w-full items-center justify-center gap-2 border-t border-border bg-background text-base font-medium text-muted-foreground transition hover:bg-muted/40 hover:text-foreground">
        {t("socialPage.discoverMore")}
      </Link>
    </div>
  );
}

function ProfilePostActionButton({
  children,
  active = false,
  activeClass = "text-white",
  disabled = false,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-md px-1 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
        active && activeClass
      )}
    >
      {children}
    </button>
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
    <div className={cn("grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm", isReply && "ml-5 border-l border-white/10 pl-3")}>
      <Avatar name={comment.author?.name ?? "?"} avatarUrl={comment.author?.avatarUrl ?? undefined} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-semibold leading-5 text-white">
          {authorName}
          <span className="ml-2 font-normal text-white/42">{formatProfilePostTime(comment.createdAt, locale, t("profile.public.justNow"))}</span>
          {edited && <span className="ml-2 font-normal text-white/42">{t("profile.public.edited")}</span>}
        </p>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editingBody}
              onChange={(event) => setEditingBody(event.target.value)}
              rows={2}
              maxLength={500}
              className="min-h-16 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/35 focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setEditing(false)}>
                {t("profile.misc.cancel")}
              </Button>
              <Button type="button" size="sm" disabled={!editingBody.trim()} onClick={saveEdit}>
                {t("profile.misc.save")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-5 text-white/82">{comment.body}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-white/45">
          {!isReply && userId && (
            <button type="button" className="transition hover:text-white" onClick={() => setReplying((value) => !value)}>
              {t("profile.public.reply")}
            </button>
          )}
          {isOwnComment && (
            <button type="button" className="inline-flex items-center gap-1 transition hover:text-white" onClick={() => {
              setEditingBody(comment.body);
              setEditing(true);
            }}>
              <Pencil className="h-3.5 w-3.5" />
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
              className="min-h-9 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/35 focus:border-primary"
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

function formatMessageTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Jetzt";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} Min`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} Std`;
  const days = Math.floor(diffMs / day);
  if (days < 7) return `${days} Tg`;
  return new Date(timestamp).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function TrainingTab({
  trainingGoal,
  favoriteLift,
  trainingSummary,
  templates,
  ownerView,
  openTemplateMenuId,
  editingTemplateId,
  templateDrafts,
  onOpenTemplateMenu,
  onEditTemplate,
  onDeleteTemplate,
  onTemplateDraftChange,
  onCancelTemplateEdit,
  onSaveTemplateEdit,
}: {
  trainingGoal?: string;
  favoriteLift?: string;
  trainingSummary: ProfileTrainingSummary | null | undefined;
  templates: ProfileWorkoutTemplate[] | undefined;
  ownerView: boolean;
  openTemplateMenuId: string | null;
  editingTemplateId: string | null;
  templateDrafts: Record<string, {
    name: string;
    description: string;
    visibility: "private" | "friends" | "public";
    showWeights: boolean;
  }>;
  onOpenTemplateMenu: (templateId: string | null) => void;
  onEditTemplate: (template: ProfileWorkoutTemplate) => void;
  onDeleteTemplate: (templateId: Id<"workout_templates">) => void;
  onTemplateDraftChange: (templateId: Id<"workout_templates">, draft: Partial<{
    name: string;
    description: string;
    visibility: "private" | "friends" | "public";
    showWeights: boolean;
  }>) => void;
  onCancelTemplateEdit: (templateId: Id<"workout_templates">) => void;
  onSaveTemplateEdit: (template: ProfileWorkoutTemplate) => void;
}) {
  const { t } = useAppPreferences();
  const showGoal = Boolean(trainingGoal);
  const showFavoriteLift = Boolean(favoriteLift);
  const showHistory = Boolean(trainingSummary);
  const showTemplates = ownerView || templates === undefined || (templates?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {showGoal && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Target className="h-4 w-4" />
            {t("profile.fields.trainingGoal")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-foreground sm:text-lg">
            {trainingGoal || t("profile.training.emptyGoal")}
          </p>
        </div>
      )}

      {showFavoriteLift && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Dumbbell className="h-4 w-4 text-primary" />
            {t("profile.fields.favoriteLift")}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{favoriteLift || t("common.noData")}</p>
        </div>
      )}

      {showHistory && <WorkoutHistoryCard trainingSummary={trainingSummary} />}
      {showTemplates && (
        <WorkoutTemplatesCard
          templates={templates}
          ownerView={ownerView}
          embedded
          openTemplateMenuId={openTemplateMenuId}
          editingTemplateId={editingTemplateId}
          templateDrafts={templateDrafts}
          onOpenTemplateMenu={onOpenTemplateMenu}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onTemplateDraftChange={onTemplateDraftChange}
          onCancelTemplateEdit={onCancelTemplateEdit}
          onSaveTemplateEdit={onSaveTemplateEdit}
        />
      )}
      {!showGoal && !showFavoriteLift && !showHistory && !showTemplates && (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55">
          Keine öffentlich sichtbaren Trainingsinfos.
        </div>
      )}
    </div>
  );
}

function WorkoutHistoryCard({
  trainingSummary,
}: {
  trainingSummary: ProfileTrainingSummary | null | undefined;
}) {
  const { locale, t } = useAppPreferences();

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="flex items-center gap-2 font-medium">
        <Activity className="h-4 w-4 text-primary" />
        {t("profile.training.history")}
      </p>
      {trainingSummary ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickStat label="Workouts" value={String(trainingSummary.completedWorkouts)} />
          <QuickStat label="Sets" value={String(trainingSummary.totalSets)} />
          <QuickStat label={t("profile.metrics.volume30")} value={`${Math.round(trainingSummary.totalVolume).toLocaleString(locale)} kg`} />
          <QuickStat label={t("profile.metrics.activity")} value={`${trainingSummary.averageWorkoutsPerWeek}/${t("profile.metrics.week")}`} />
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("profile.training.emptyHistory")}</p>
      )}
    </div>
  );
}

function TopLogsCard({ logs, embedded = false }: { logs: ProfileTopLog[] | undefined; embedded?: boolean }) {
  const { locale, t } = useAppPreferences();
  const highlight = logs?.[0];

  return (
    <Card className={cn("overflow-hidden shadow-xl", embedded && "shadow-none")}>
      <CardHeader className="border-b border-border/70 bg-muted/10 p-4 sm:p-6">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t("profile.tabs.logs")}
          </span>
          {logs?.some((log) => log.isTopFivePercent) && (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              Top 5%
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Verified Lifts mit Leaderboard-Gefühl und Platz für künftige Video-Highlights.</p>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-6">
        {logs === undefined ? (
          <p className="text-sm text-muted-foreground">{t("profile.topLogs.loading")}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("profile.topLogs.empty")}
          </p>
        ) : (
          <>
          {highlight && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-muted/20 to-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{t("profile.topLogs.currentHighlight")}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{highlight.exerciseName || LIFT_LABELS[highlight.submission.liftType]}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {highlight.submission.weightKg} kg x {highlight.submission.reps} · Score {highlight.submission.score ?? "-"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {highlight.rank && <Badge variant="secondary">#{highlight.rank} {t("profile.topLogs.of")} {highlight.total}</Badge>}
                  {highlight.percentile && <Badge variant="outline">{highlight.percentile}% Percentile</Badge>}
                  <Badge variant="outline" className="border-primary/30">
                    <ImageIcon className="h-3 w-3" />
                    {t("profile.topLogs.videoReady")}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.submission._id} className="rounded-2xl border border-border bg-muted/25 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/40">
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
                  {log.percentile && <Badge variant="outline">{log.percentile}% Percentile</Badge>}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WorkoutTemplatesCard({
  templates,
  ownerView = false,
  embedded = false,
  openTemplateMenuId,
  editingTemplateId,
  templateDrafts,
  onOpenTemplateMenu,
  onEditTemplate,
  onDeleteTemplate,
  onTemplateDraftChange,
  onCancelTemplateEdit,
  onSaveTemplateEdit,
}: {
  templates: ProfileWorkoutTemplate[] | undefined;
  ownerView?: boolean;
  embedded?: boolean;
  openTemplateMenuId: string | null;
  editingTemplateId: string | null;
  templateDrafts: Record<string, {
    name: string;
    description: string;
    visibility: "private" | "friends" | "public";
    showWeights: boolean;
  }>;
  onOpenTemplateMenu: (templateId: string | null) => void;
  onEditTemplate: (template: ProfileWorkoutTemplate) => void;
  onDeleteTemplate: (templateId: Id<"workout_templates">) => void;
  onTemplateDraftChange: (templateId: Id<"workout_templates">, draft: Partial<{
    name: string;
    description: string;
    visibility: "private" | "friends" | "public";
    showWeights: boolean;
  }>) => void;
  onCancelTemplateEdit: (templateId: Id<"workout_templates">) => void;
  onSaveTemplateEdit: (template: ProfileWorkoutTemplate) => void;
}) {
  const { locale, t } = useAppPreferences();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  return (
    <Card className={cn("shadow-xl", embedded && "shadow-none")}>
      <CardHeader className="border-b border-border/70 bg-muted/10">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          {t("profile.playlists.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("profile.playlists.copy")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {templates === undefined ? (
          <p className="text-sm text-muted-foreground">{t("profile.playlists.loading")}</p>
        ) : templates.length === 0 ? (
          <ProfileEmpty
            icon={PlusCircle}
            title={t("profile.playlists.emptyOwner")}
            copy={ownerView ? t("profile.playlists.emptyOwnerCopy") : t("profile.playlists.emptyPublic")}
            action={ownerView ? { href: "/workouts", label: t("profile.playlists.prepare") } : undefined}
          />
        ) : (
          templates.map((template) => {
            const isEditing = editingTemplateId === template._id;
            const isExpanded = expandedTemplateId === template._id;
            const draft = templateDrafts[template._id] ?? {
              name: template.name,
              description: template.description ?? "",
              visibility: template.visibility,
              showWeights: template.showWeights,
            };

            return (
            <div key={template._id} className="premium-panel min-w-0 overflow-hidden rounded-3xl transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
              <div className="gym-image-overlay relative min-h-32">
                <Image
                  src="/brand/playlist-hero.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 42rem, 100vw"
                />
                <div className="relative z-10 flex min-h-32 items-end p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-brand">
                      {template.visibility}
                    </p>
                    <p className="mt-1 text-xl font-semibold">{template.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4">
              {isEditing && (
                <div className="mb-4 grid gap-3 rounded-lg border border-border bg-background/70 p-3">
                  <div className="grid gap-1.5">
                    <Label>{t("profile.playlists.name")}</Label>
                    <Input value={draft.name} maxLength={80} onChange={(event) => onTemplateDraftChange(template._id, { name: event.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("profile.playlists.description")}</Label>
                    <Textarea value={draft.description} rows={2} maxLength={180} onChange={(event) => onTemplateDraftChange(template._id, { description: event.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <Select
                      value={draft.visibility}
                      onValueChange={(value) =>
                        onTemplateDraftChange(template._id, { visibility: value as "private" | "friends" | "public" })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">{t("profile.playlists.private")}</SelectItem>
                        <SelectItem value="friends">{t("profile.playlists.friends")}</SelectItem>
                        <SelectItem value="public">{t("profile.playlists.public")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex min-h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.showWeights}
                        onChange={(event) => onTemplateDraftChange(template._id, { showWeights: event.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      {t("profile.playlists.showWeights")}
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => onCancelTemplateEdit(template._id)}>
                      {t("profile.misc.cancel")}
                    </Button>
                    <Button type="button" disabled={!draft.name.trim()} onClick={() => onSaveTemplateEdit(template)}>
                      {t("profile.misc.save")}
                    </Button>
                  </div>
                </div>
              )}
              <div
                role="button"
                tabIndex={0}
                className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between"
                onClick={() => !isEditing && setExpandedTemplateId((current) => current === template._id ? null : template._id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!isEditing) {
                      setExpandedTemplateId((current) => current === template._id ? null : template._id);
                    }
                  }
                }}
                aria-expanded={isExpanded}
              >
                <div className="min-w-0">
                  <p className="break-words font-medium">{template.name}</p>
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
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant={template.visibility === "public" ? "default" : "outline"}>
                    {template.visibility === "public"
                      ? t("profile.playlists.public")
                      : template.visibility === "friends"
                        ? t("profile.playlists.friends")
                        : t("profile.playlists.private")}
                  </Badge>
                  <Badge variant="secondary">
                    {template.showWeights ? t("profile.playlists.withWeights") : t("profile.playlists.withoutWeights")}
                  </Badge>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                  {ownerView && !isEditing && (
                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("profile.playlists.options")}
                        onClick={() => onOpenTemplateMenu(openTemplateMenuId === template._id ? null : template._id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {openTemplateMenuId === template._id && (
                        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-sm">
                          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition hover:bg-muted" onClick={() => onEditTemplate(template)}>
                            <Pencil className="h-3.5 w-3.5" />
                            {t("profile.misc.edit")}
                          </button>
                          <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-destructive transition hover:bg-destructive/10" onClick={() => onDeleteTemplate(template._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("profile.misc.delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isExpanded && (
              <div className="mt-3 grid gap-3 border-t border-border pt-3">
                <Link href={`/workouts/new?templateId=${template._id}`} className="inline-flex">
                  <Button type="button" className="gap-2">
                    <Play className="h-4 w-4" />
                    {t("profile.playlists.startWorkout")}
                  </Button>
                </Link>
                <div className="grid gap-2">
                {template.exercises.map((exercise) => (
                  <div key={`${template._id}-${exercise.exerciseName}`} className="min-w-0 rounded-lg bg-background p-2 text-sm">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words font-medium">{exercise.exerciseName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{exercise.sets.length} Sets</span>
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                      {exercise.sets
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
            </div>
          );
          })
        )}
      </CardContent>
    </Card>
  );
}

type ChatMessageView = {
  body: string;
  postId?: Id<"social_posts">;
  mediaUrl?: string | null;
  sender?: { name: string; avatarUrl?: string | null } | null;
  postPreview?: {
    _id: Id<"social_posts">;
    author: { name: string; username?: string } | null;
    excerpt: string;
    mediaUrl?: string | null;
    mediaType?: "image" | "video" | "gif" | null;
  } | null;
};

function PostShareCard({ message, mine }: { message: ChatMessageView; mine: boolean }) {
  const { t } = useAppPreferences();
  const postId = message.postId ?? message.postPreview?._id;
  const href = postId ? `/social?post=${postId}` : "/social";
  const authorName = message.postPreview?.author?.name ?? t("profile.public.unknownAuthor");
  const authorLabel = message.postPreview?.author
    ? `@${message.postPreview.author.username ?? message.postPreview.author.name}`
    : t("profile.public.unknownAuthor");
  const excerpt = message.postPreview?.excerpt || t("profile.public.unavailablePost");

  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-[1.25rem] border text-foreground shadow-[0_18px_48px_rgba(0,0,0,0.28)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mine
          ? "border-primary/75 bg-[#0b1111] hover:bg-[#101717]"
          : "border-primary/60 bg-[#0c1212] hover:bg-[#101717]"
      )}
    >
      <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(255,143,0,0.12),transparent_9rem)] p-3">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-bold text-primary">
              {authorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-4">{authorName}</p>
              <p className="truncate text-xs leading-4 text-muted-foreground">{authorLabel}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-primary/16 px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-primary shadow-[0_10px_28px_rgba(255,132,0,0.12)]">
            {t("profile.public.sharedPost")}
          </span>
        </div>

        {message.postPreview?.mediaUrl && (
          <div className="relative mb-3 overflow-hidden rounded-[1rem] bg-black/50">
            {message.postPreview.mediaType === "video" ? (
              <>
                <video src={message.postPreview.mediaUrl} className="aspect-[1.9/1] w-full object-cover" muted />
                <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/75 bg-black/20 text-white backdrop-blur-sm">
                  <Play className="ml-0.5 h-5 w-5 fill-white" />
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.postPreview.mediaUrl} alt="" className="aspect-[1.9/1] w-full object-cover" />
            )}
          </div>
        )}

        <p className={cn(
          "whitespace-pre-wrap break-words text-foreground",
          message.postPreview?.mediaUrl
            ? "line-clamp-3 text-[1.05rem] font-semibold leading-6"
            : "line-clamp-6 text-[1.05rem] font-medium leading-6"
        )}>
          {excerpt}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-xs text-muted-foreground">GymLogs</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors group-hover:text-primary/90">
            {t("profile.public.viewPost")}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ImageMessage({ message }: { message: ChatMessageView }) {
  return (
    <div className="space-y-2">
      {message.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={message.mediaUrl} alt="" className="max-h-[22rem] w-full rounded-2xl object-contain" />
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.05]">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      {message.body && <p className="whitespace-pre-wrap break-words leading-5">{message.body}</p>}
    </div>
  );
}

function ProfileHeaderActions({
  unreadTotal,
  onShare,
  onOpenMessages,
  onOpenNetwork,
}: {
  unreadTotal: number;
  onShare: () => void;
  onOpenMessages: () => void;
  onOpenNetwork: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useAppPreferences();
  const unreadLabel = unreadTotal > 99 ? "99+" : String(unreadTotal);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <Button
        size="icon"
        variant="ghost"
        className="size-9 rounded-full text-white hover:bg-white/10 sm:size-11"
        aria-label={t("profile.actions.share")}
        onClick={onShare}
      >
        <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <div className="relative" ref={menuRef}>
        <Button
          size="icon"
          variant="ghost"
          className="relative size-9 rounded-full text-white hover:bg-white/10 sm:size-11"
          aria-label={t("profile.actions.socialMenu")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadTotal > 0 && (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full border border-background bg-primary px-1 text-[0.6rem] font-bold leading-4 text-primary-foreground sm:min-w-5 sm:leading-5">
              {unreadLabel}
            </span>
          )}
        </Button>
        {open && (
          <div
            role="menu"
            aria-label={t("profile.actions.socialMenu")}
            className="premium-panel absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl p-1.5 text-sm text-white shadow-2xl shadow-black/45"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              onClick={() => choose(onOpenNetwork)}
            >
              <Users className="h-4 w-4 text-white/58" />
              <span className="min-w-0 flex-1 truncate">{t("profile.actions.network")}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              onClick={() => choose(onOpenMessages)}
            >
              <MessageCircle className="h-4 w-4 text-white/58" />
              <span className="min-w-0 flex-1 truncate">{t("profile.actions.messages")}</span>
              {unreadTotal > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-bold leading-5 text-primary-foreground">
                  {unreadLabel}
                </span>
              )}
            </button>
            <Link
              role="menuitem"
              href="/settings"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-white/58" />
              <span className="min-w-0 flex-1 truncate">{t("profile.actions.settings")}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileMetric({
  icon: Icon,
  iconClassName,
  value,
  label,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="min-h-[5.75rem] border-r border-border px-1.5 py-3 text-center transition-colors last:border-r-0 hover:bg-muted/40 sm:min-h-28 sm:px-3 sm:py-4" aria-label={`${label}: ${value}${detail ? `, ${detail}` : ""}`}>
      <Icon aria-hidden="true" className={cn("mx-auto mb-2 h-4 w-4 text-muted-foreground sm:mb-3 sm:h-5 sm:w-5", iconClassName)} />
      <p className="truncate text-[0.92rem] font-bold leading-tight text-foreground min-[390px]:text-[1rem] sm:text-xl" title={value}>{value}</p>
      <p className="mt-1.5 text-[0.68rem] leading-tight text-muted-foreground min-[390px]:text-[0.72rem] sm:mt-2 sm:text-sm">{label}</p>
      {detail && <p className="mt-1 truncate text-[0.66rem] leading-tight text-muted-foreground/80 min-[390px]:text-[0.7rem] sm:text-sm" title={detail}>{detail}</p>}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" | "chat" | "lg" | "hero" }) {
  const classes =
    size === "hero"
      ? "h-[4.5rem] w-[4.5rem] text-4xl sm:h-28 sm:w-28 sm:text-7xl"
      : size === "lg"
        ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl"
        : size === "chat"
          ? "h-14 w-14 text-xl"
        : size === "sm"
          ? "h-8 w-8 text-sm"
          : "h-11 w-11 text-base";
  return (
    <div className={`${classes} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-primary bg-muted font-semibold text-foreground shadow-lg sm:border-4`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "U").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 max-w-full space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ProfileVisibilitySelect({
  value,
  onChange,
}: {
  value: "private" | "public";
  onChange: (value: "private" | "public") => void;
}) {
  const { t } = useAppPreferences();
  const options = [
    { value: "private" as const, label: t("profile.visibility.private"), icon: Lock },
    { value: "public" as const, label: t("profile.visibility.public"), icon: Users },
  ];

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-muted/30 p-3">
      <div className="min-w-0">
        <p className="font-semibold">{t("profile.visibility.title")}</p>
        <p className="mt-1 max-w-full text-xs leading-5 text-muted-foreground">
          {t("profile.visibility.copy")}
        </p>
      </div>
      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex min-h-10 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg border px-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
      <span className="min-w-0 leading-5">
        <span className="block">{label}</span>
        {description && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" />
    </label>
  );
}

function ProfileEmpty({
  icon: Icon,
  title,
  copy,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="mt-1 leading-5 text-muted-foreground">{copy}</p>
          {action && (
            <Link href={action.href}>
              <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                {action.label}
                <MoveRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  detail,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ComponentType<{ className?: string }>;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-[6rem] rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        featured
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-muted/20 hover:border-primary/25 hover:bg-muted/35"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-medium uppercase leading-none tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-primary" />}
      </div>
      <p className="mt-3 text-xl font-semibold leading-tight tracking-tight">{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}


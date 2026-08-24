"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  BadgeCheck,
  Calendar,
  Camera,
  ChevronDown,
  Crown,
  Dumbbell,
  ExternalLink,
  Eye,
  Flag,
  Flame,
  ImageIcon,
  ImagePlus,
  Lock,
  MapPin,
  MoreHorizontal,
  MessageCircle,
  MoveRight,
  Paperclip,
  Pencil,
  PlusCircle,
  Play,
  Ruler,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
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
import { SocialPostCard } from "@/components/social/SocialPageClient";
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
  sourceTemplateVersion?: number;
  version?: number;
  pendingSourceUpdate?: {
    sourceTemplateId: Id<"workout_templates">;
    sourceVersion: number;
    createdAt: number;
    summary: TemplateChangeSummary[];
  };
  totalExercises: number;
  totalSets: number;
  totalVolume: number | null;
  executionCount: number;
  exercises: ProfileWorkoutTemplateExercise[];
};

type TemplateChangeSummary = {
  kind: "added" | "removed" | "changed";
  exerciseName: string;
  beforeName?: string;
  afterName?: string;
  beforeSets?: number;
  afterSets?: number;
};

type ProfileWorkoutTemplateExercise = {
  exerciseId: Id<"exercises">;
  exerciseName: string;
  muscleGroup: string;
  category: string;
  sets: Array<{ reps: number; weight: number | null }>;
};

type WorkoutTemplateDraftExercise = {
  exerciseId: Id<"exercises">;
  exerciseName: string;
  muscleGroup: string;
  category: string;
  sets: Array<{ reps: number; weight: number }>;
};

type WorkoutTemplateDraft = {
  name: string;
  description: string;
  visibility: "private" | "friends" | "public";
  showWeights: boolean;
  exercises: WorkoutTemplateDraftExercise[];
};

type ExerciseCatalogItem = {
  _id: Id<"exercises">;
  name: string;
  muscleGroup: string;
  category: string;
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
  author?: null | {
    _id: Id<"users">;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    isPro: boolean;
  };
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
  const acceptWorkoutTemplateUpdate = useMutation(api.workouts.acceptTemplateUpdate);
  const keepWorkoutTemplateVersion = useMutation(api.workouts.keepTemplateVersion);
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
  const [messageSearch, setMessageSearch] = useState("");
  const thread = useQuery(
    api.messages.thread,
    userId && activeConversation ? { userId, conversationId: activeConversation } : "skip"
  );
  const [messageBody, setMessageBody] = useState("");
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
  const [workoutTemplateDrafts, setWorkoutTemplateDrafts] = useState<Record<string, WorkoutTemplateDraft>>({});
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
    function openMessages() {
      setMessagesDialogOpen(true);
    }

    function selectTabFromHash() {
      const hash = window.location.hash;
      if (hash === "#messages") openMessages();
      if (hash === "#network" || hash === "#friends") setNetworkDialogOpen(true);
      if (hash === "#training" || hash === "#workouts" || hash === "#playlists") setActiveProfileTab("training");
    }

    selectTabFromHash();
    const pendingMessageUserId = window.sessionStorage.getItem("gymlogs:pending-message-user");
    if (pendingMessageUserId) {
      window.sessionStorage.removeItem("gymlogs:pending-message-user");
      setMessagesDialogOpen(true);
      setNetworkDialogOpen(true);
      setMessageTarget(pendingMessageUserId as Id<"users">);
    }
    window.addEventListener("hashchange", selectTabFromHash);
    window.addEventListener("gymlogs:open-messages", openMessages);
    return () => {
      window.removeEventListener("hashchange", selectTabFromHash);
      window.removeEventListener("gymlogs:open-messages", openMessages);
    };
  }, []);

  function setMessagesOpen(open: boolean) {
    setMessagesDialogOpen(open);
    if (!open && typeof window !== "undefined" && window.location.hash === "#messages") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

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
    const needle = messageSearch.trim().toLowerCase();
    if (!conversations || !needle) return conversations;

    return conversations.filter((conversation) => {
      const searchable = [
        conversation.otherUser?.name,
        conversation.otherUser?.username,
        conversation.lastMessagePreview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(needle);
    });
  }, [conversations, messageSearch]);
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
  const displayName = form.name || user?.name || t("profile.public.unknownUser");
  const displayUsername = form.username || user?.username || "";
  const profileMeta = [
    { icon: Calendar, value: joinedLabel },
    visibleProfile?.location ? { icon: MapPin, value: visibleProfile.location } : null,
    visibleProfile?.heightCm ? { icon: Ruler, value: `${visibleProfile.heightCm} cm` } : null,
    visibleProfile?.weightKg ? { icon: Dumbbell, value: `${visibleProfile.weightKg} kg` } : null,
    visibleProfile?.birthDate
      ? {
          icon: User,
          value: new Date(visibleProfile.birthDate).toLocaleDateString(locale),
        }
      : null,
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
    { icon: Calendar, value: joinedLabel },
    previewVisibleProfile.location ? { icon: MapPin, value: previewVisibleProfile.location } : null,
    previewVisibleProfile.heightCm ? { icon: Ruler, value: `${previewVisibleProfile.heightCm} cm` } : null,
    previewVisibleProfile.weightKg ? { icon: Dumbbell, value: `${previewVisibleProfile.weightKg} kg` } : null,
    previewVisibleProfile.birthDate
      ? {
          icon: User,
          value: new Date(previewVisibleProfile.birthDate).toLocaleDateString(locale),
        }
      : null,
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

  function toWorkoutTemplateDraftExercise(
    exercise: ProfileWorkoutTemplateExercise
  ): WorkoutTemplateDraftExercise {
    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight ?? 0,
      })),
    };
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
        exercises: template.exercises.map(toWorkoutTemplateDraftExercise),
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
      exercises: draft.exercises,
    });
    cancelWorkoutTemplateEdit(template._id);
  }

  async function acceptWorkoutTemplateSourceUpdate(templateId: Id<"workout_templates">) {
    if (!userId) return;
    await acceptWorkoutTemplateUpdate({ userId, templateId });
  }

  async function keepWorkoutTemplateSourceVersion(templateId: Id<"workout_templates">) {
    if (!userId) return;
    await keepWorkoutTemplateVersion({ userId, templateId });
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
    if (targetId) {
      setNetworkDialogOpen(false);
      setMessagesDialogOpen(true);
    }
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
      : "radial-gradient(circle at 18% 12%, var(--brand-wash), transparent 34%), linear-gradient(135deg, var(--card), var(--background))",
  };

  return (
    <div className="-mx-3 -mt-3 bg-background pb-8 text-foreground sm:mx-auto sm:mt-0 sm:max-w-5xl sm:overflow-hidden sm:rounded-lg sm:border sm:border-border">
      <div className="space-y-0">
        <Card className="overflow-hidden rounded-none border-0 bg-background py-0 text-card-foreground ring-0 shadow-none">
          <div
            className="relative min-h-[26rem] overflow-hidden bg-cover bg-center sm:min-h-[31rem]"
            style={profileCoverStyle}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,color-mix(in_oklch,var(--brand)_20%,transparent),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.28),rgba(0,0,0,0.58)_48%,var(--background)_98%)]" />
            <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between sm:left-8 sm:right-8 sm:top-6">
              <Button size="icon" variant="ghost" className="size-12 rounded-xl border border-white/15 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-white/10 sm:size-14" aria-label={t("profile.misc.back")} onClick={() => history.back()}>
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <ProfileHeaderActions
                unreadTotal={unreadTotal}
                onShare={shareProfile}
                onOpenMessages={() => setMessagesDialogOpen(true)}
                onOpenNetwork={() => setNetworkDialogOpen(true)}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-9 sm:pb-8">
              <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-end gap-4 min-[390px]:grid-cols-[8rem_minmax(0,1fr)] min-[390px]:gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
                <div className="relative self-end">
                  <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/20 blur-2xl" />
                  <Avatar name={displayName} avatarUrl={displayAvatarUrl} size="hero" />
                  {isOwnProfile && (
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border border-white/15 bg-background/90 text-foreground shadow-xl shadow-black/30 backdrop-blur transition hover:bg-muted sm:size-12"
                      aria-label={t("profile.misc.editAvatar")}
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>
                <div className="min-w-0 pb-1 sm:pb-2">
                  <Badge className="mb-2 gap-1 rounded-full border-primary/35 bg-primary/10 px-2.5 py-1 text-[0.68rem] text-primary shadow-sm backdrop-blur sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
                    {form.isPublic ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {form.isPublic ? t("profile.status.public") : t("profile.status.private")}
                  </Badge>
                  <h1 className="flex min-w-0 items-center gap-2 text-[2rem] font-black leading-[0.95] tracking-normal min-[390px]:text-[2.45rem] sm:text-6xl">
                    <span className="truncate">{displayName}</span>
                    {user?.isPro && <BadgeCheck className="h-7 w-7 shrink-0 fill-primary text-primary-foreground sm:h-10 sm:w-10" />}
                  </h1>
                  {displayUsername && <p className="mt-2 truncate text-[1rem] leading-tight text-muted-foreground min-[390px]:text-[1.18rem] sm:text-2xl">@{displayUsername}</p>}
                  {visibleProfile?.bio && (
                    <p className="mt-3 line-clamp-2 max-w-[34rem] whitespace-pre-wrap text-[0.92rem] font-semibold leading-[1.35] text-foreground min-[390px]:text-[1rem] sm:mt-6 sm:text-2xl">
                      {visibleProfile.bio}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.78rem] text-muted-foreground min-[390px]:text-[0.88rem] sm:mt-6 sm:gap-x-7 sm:text-lg">
                    {profileMeta.map(({ icon: Icon, value }) => (
                      <span key={value} className="inline-flex items-center gap-1.5 sm:gap-2.5">
                        <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                        {value}
                      </span>
                    ))}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 transition hover:text-foreground sm:gap-2.5"
                      onClick={() => setFollowDialogOpen(true)}
                    >
                      <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                      {(followGraph?.followerCount ?? 0).toLocaleString(locale)} {t("profile.follow.followerLine")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="relative z-10 space-y-5 bg-background px-4 pb-7 pt-0 sm:space-y-6 sm:px-7 lg:px-9">
            {isOwnProfile && (
              <Button type="button" variant="outline" className="h-14 w-full rounded-lg border-border/80 bg-card/55 text-base font-extrabold text-primary shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-primary/10 sm:h-14 sm:text-lg" onClick={() => setEditProfileOpen(true)}>
                <Pencil className="mr-2 h-5 w-5" />
                {t("profile.edit.title")}
              </Button>
            )}
            {profileMetricItems.length > 0 && (
              <div
                className={cn(
                  "grid grid-cols-2 overflow-hidden rounded-lg border border-border/80 bg-card/45 shadow-sm backdrop-blur",
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
            <div className="-mx-4 overflow-x-auto border-y border-border/70 bg-background/85 px-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-3">
              <div className="flex w-max min-w-full gap-3 sm:gap-6">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      profileTabRefs.current[tab.id] = node;
                    }}
                    type="button"
                    onClick={() => setActiveProfileTab(tab.id)}
                    className={cn(
                      "relative min-h-[3.65rem] shrink-0 whitespace-nowrap px-2 text-base font-extrabold text-muted-foreground transition-colors hover:text-foreground sm:min-h-[4.5rem] sm:text-lg",
                      activeProfileTab === tab.id && "text-primary"
                    )}
                  >
                    {tab.label}
                    {activeProfileTab === tab.id && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" style={{ boxShadow: "0 0 18px var(--brand-glow)" }} />
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
                profileName={displayName}
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
                profileName={displayName}
                username={displayUsername}
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
                profileName={displayName}
                username={displayUsername}
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
              <ProfileMediaGrid
                posts={mediaPosts}
                profileName={displayName}
                username={displayUsername}
                avatarUrl={displayAvatarUrl}
                isPro={Boolean(user?.isPro)}
                selectedPostId={activeProfileCommentPostId}
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
                catalogExercises={catalogExercises}
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
                    [templateId]: { ...current[templateId], ...draft } as WorkoutTemplateDraft,
                  }))
                }
                onCancelTemplateEdit={cancelWorkoutTemplateEdit}
                onSaveTemplateEdit={saveWorkoutTemplateEdit}
                onAcceptTemplateUpdate={acceptWorkoutTemplateSourceUpdate}
                onKeepTemplateVersion={keepWorkoutTemplateSourceVersion}
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
                  profileEditMode === "preview" ? "min-h-[26rem] sm:min-h-[31rem]" : "min-h-[16rem] sm:min-h-52",
                )}
                style={profileCoverStyle}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    profileEditMode === "preview"
                      ? "bg-[radial-gradient(circle_at_18%_30%,color-mix(in_oklch,var(--brand)_20%,transparent),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.28),rgba(0,0,0,0.58)_48%,var(--background)_98%)]"
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
                  <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between sm:left-8 sm:right-8 sm:top-6">
                    <Button size="icon" variant="ghost" className="size-12 rounded-xl border border-white/15 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-white/10 sm:size-14" aria-label={t("profile.misc.back")} onClick={() => setProfileEditMode("edit")}>
                      <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-12 rounded-xl border border-white/15 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-white/10 sm:size-14" aria-label={t("profile.misc.closeEditor")} onClick={closeProfileEditor}>
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
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
                      ? "absolute inset-x-0 bottom-0 grid-cols-[7.25rem_minmax(0,1fr)] gap-4 px-4 pb-6 min-[390px]:grid-cols-[8rem_minmax(0,1fr)] min-[390px]:gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8 sm:px-9 sm:pb-8"
                      : "grid-cols-[5.25rem_minmax(0,1fr)] gap-3 px-4 pb-4 pt-14 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4 sm:px-7 sm:pb-5 sm:pt-0",
                  )}
                >
                  <div className="relative self-end">
                    {profileEditMode === "preview" && <div className="pointer-events-none absolute -inset-2 rounded-full bg-primary/20 blur-2xl" />}
                    <button
                      type="button"
                      className={cn("block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", profileEditMode === "preview" && "relative")}
                      aria-label={t("profile.misc.editAvatar")}
                      onClick={() => profileEditMode === "edit" && setAvatarMenuOpen((open) => !open)}
                    >
                      <Avatar name={form.name} avatarUrl={displayAvatarUrl} size={profileEditMode === "preview" ? "hero" : "lg"} />
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
                      <Badge className="mb-2 gap-1 rounded-full border-primary/35 bg-primary/10 px-2.5 py-1 text-[0.68rem] text-primary shadow-sm backdrop-blur sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
                        {form.isPublic ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {form.isPublic ? t("profile.status.public") : t("profile.status.private")}
                      </Badge>
                    )}
                    {profileEditMode === "preview" ? (
                      <h1 className="flex min-w-0 items-center gap-2 text-[2rem] font-black leading-[0.95] tracking-normal min-[390px]:text-[2.45rem] sm:text-6xl">
                        <span className="truncate">{form.name || t("profile.public.unknownUser")}</span>
                        {user?.isPro && <BadgeCheck className="h-7 w-7 shrink-0 fill-primary text-primary-foreground sm:h-10 sm:w-10" />}
                      </h1>
                    ) : (
                      <h2 className="truncate text-2xl font-black leading-tight sm:text-3xl">
                        {form.name || t("profile.public.unknownUser")}
                      </h2>
                    )}
                    {form.username && (
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        <p className={cn("truncate text-muted-foreground", profileEditMode === "preview" ? "text-[1rem] leading-tight min-[390px]:text-[1.18rem] sm:text-2xl" : "text-sm")}>
                          @{form.username}
                        </p>
                      </div>
                    )}
                    {profileEditMode === "preview" && (
                      <>
                        {previewVisibleProfile.bio && (
                          <p className="mt-3 line-clamp-2 max-w-[34rem] whitespace-pre-wrap text-[0.92rem] font-semibold leading-[1.35] text-foreground min-[390px]:text-[1rem] sm:mt-6 sm:text-2xl">
                            {previewVisibleProfile.bio}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.78rem] text-muted-foreground min-[390px]:text-[0.88rem] sm:mt-6 sm:gap-x-7 sm:text-lg">
                          {previewMeta.map(({ icon: Icon, value }) => (
                            <span key={value} className="inline-flex items-center gap-1.5 sm:gap-2.5">
                              <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                              {value}
                            </span>
                          ))}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 transition hover:text-foreground sm:gap-2.5"
                            onClick={() => setFollowDialogOpen(true)}
                          >
                            <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                            {(followGraph?.followerCount ?? 0).toLocaleString(locale)} {t("profile.follow.followerLine")}
                          </button>
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
                    ? "space-y-5 bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-0 sm:space-y-6 sm:px-7 sm:pb-7 lg:px-9"
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
                  <div className="space-y-5">
                    <div className={cn("grid w-full gap-2", form.allowMessages ? "grid-cols-2" : "grid-cols-1")}>
                      {form.allowMessages && (
                        <Button type="button" className="h-14 w-full rounded-lg text-base font-extrabold shadow-sm transition-all hover:-translate-y-0.5 sm:h-14 sm:text-lg">
                          <MessageCircle className="h-4 w-4" />
                          {t("profile.misc.message")}
                        </Button>
                      )}
                      <Button type="button" variant="outline" className="h-14 w-full rounded-lg border-border/80 bg-card/55 text-base font-extrabold shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-primary/10 sm:h-14 sm:text-lg">
                        <User className="h-4 w-4" />
                        {t("profile.misc.addFriend")}
                      </Button>
                    </div>
                    {previewTrainingSummary && hasVisiblePreviewMetric && (
                      <div
                        className={cn(
                          "grid grid-cols-2 overflow-hidden rounded-lg border border-border/80 bg-card/45 shadow-sm backdrop-blur",
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
                        <div className="-mx-4 overflow-x-auto border-y border-border/70 bg-background/85 px-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-3">
                          <div className="flex w-max min-w-full gap-3 sm:gap-6">
                            {previewTabs.map((tab) => (
                              <button
                                key={tab.id}
                                ref={(node) => {
                                  previewTabRefs.current[tab.id] = node;
                                }}
                                type="button"
                                onClick={() => setPreviewProfileTab(tab.id)}
                                className={cn(
                                  "relative min-h-[3.65rem] shrink-0 whitespace-nowrap px-2 text-base font-extrabold text-muted-foreground transition-colors hover:text-foreground sm:min-h-[4.5rem] sm:text-lg",
                                  previewProfileTab === tab.id && "text-primary"
                                )}
                              >
                                {tab.label}
                                {previewProfileTab === tab.id && (
                                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" style={{ boxShadow: "0 0 18px var(--brand-glow)" }} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        {previewProfileTab === "posts" && (
                          <ProfilePostsCard
                            posts={posts}
                            profileName={form.name || t("profile.public.unknownUser")}
                            username={form.username}
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
                          <ProfileMediaGrid
                            posts={mediaPosts}
                            profileName={form.name || t("profile.public.unknownUser")}
                            username={form.username}
                            avatarUrl={displayAvatarUrl}
                            isPro={Boolean(user?.isPro)}
                            selectedPostId={null}
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
                            catalogExercises={catalogExercises}
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
                            onAcceptTemplateUpdate={() => undefined}
                            onKeepTemplateVersion={() => undefined}
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


        <Dialog open={messagesDialogOpen} onOpenChange={setMessagesOpen}>
          <DialogContent
            overlayClassName="z-30 md:z-50"
            className="inset-0 z-30 h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] translate-x-0 translate-y-0 overflow-hidden rounded-none border-border bg-[#090b0d] p-0 text-foreground sm:inset-auto sm:left-1/2 sm:top-1/2 sm:z-[100] sm:h-[86dvh] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
          >
            <div id="messages" className="grid h-full min-h-0 bg-[#090b0d] md:grid-cols-[22rem_minmax(0,1fr)]">
              <aside className={cn("min-h-0 border-r border-white/10 bg-[#0d1013]", thread && "hidden md:flex", "flex flex-col")}>
                <div className="shrink-0 border-b border-white/10 px-4 pb-4 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-bold tracking-normal">{t("profile.messagesPanel.title")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {conversations === undefined
                          ? t("profile.messagesPanel.loading")
                          : conversations.length === 0
                            ? t("profile.messagesPanel.emptyTitle")
                            : unreadTotal > 0
                              ? `${unreadTotal} ${t("profile.messagesPanel.unread")}`
                              : t("profile.messagesPanel.noUnread")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-3 text-sm text-muted-foreground focus-within:bg-white/[0.11] focus-within:ring-1 focus-within:ring-primary/40">
                    <Search className="h-4 w-4" />
                    <input
                      value={messageSearch}
                      onChange={(event) => setMessageSearch(event.target.value)}
                      placeholder={t("profile.networkPanel.searchPlaceholder")}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    {messageSearch && (
                      <button
                        type="button"
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                        aria-label={t("profile.messagesPanel.clearSearch")}
                        onClick={() => setMessageSearch("")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
                  {conversations === undefined ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">{t("profile.messagesPanel.loading")}</p>
                  ) : conversations.length === 0 ? (
                    <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-white/15">
                        <Send className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-semibold">{t("profile.messagesPanel.emptyTitle")}</p>
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">{t("profile.messagesPanel.emptyCopy")}</p>
                    </div>
                  ) : filteredConversations?.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {t("profile.messagesPanel.noSearchResults")}
                    </div>
                  ) : (
                    filteredConversations?.map((conversation) => (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => setActiveConversation(conversation._id)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          activeConversation === conversation._id
                            ? "bg-white/[0.11]"
                            : "hover:bg-white/[0.07]"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar name={conversation.otherUser?.name ?? "?"} avatarUrl={conversation.otherUser?.avatarUrl} />
                          {conversation.unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-[#0d1013] bg-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="flex min-w-0 items-center gap-1 truncate font-semibold">
                              <span className="truncate">{conversation.otherUser?.name ?? t("profile.messagesPanel.unknownUser")}</span>
                              {conversation.otherUser?.isPro && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                            </p>
                            {conversation.unreadCount > 0 && <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold text-primary-foreground">{conversation.unreadCount}</span>}
                          </div>
                          <p className={cn("mt-0.5 truncate text-sm", conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                            {conversation.lastMessagePreview ?? t("profile.messagesPanel.newConversation")}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </aside>

              <section className={cn("min-h-0 flex-col bg-[#07090b]", thread ? "flex" : "hidden md:flex")}>
                {!thread ? (
                  <div className="flex h-full min-h-0 flex-col items-center justify-center px-8 text-center">
                    <div className="mb-5 flex size-24 items-center justify-center rounded-full border border-white/20">
                      <Send className="h-10 w-10 text-foreground" />
                    </div>
                    <p className="text-xl font-semibold">{t("profile.messagesPanel.emptyTitle")}</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{t("profile.messagesPanel.selectThread")}</p>
                    <Button type="button" className="mt-5" onClick={() => setNetworkDialogOpen(true)}>
                      {t("profile.networkPanel.newMessage")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0b0d10] px-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="md:hidden"
                          aria-label={t("profile.messagesPanel.closeThread")}
                          title={t("profile.messagesPanel.closeThread")}
                          onClick={() => {
                            setActiveConversation(null);
                            setReportedMessage(null);
                            clearMessageImageDraft();
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} />
                        <div className="min-w-0">
                          <p className="flex min-w-0 items-center gap-1 truncate font-semibold leading-5">
                            <span className="truncate">{thread.otherUser?.name ?? t("profile.messagesPanel.unknownUser")}</span>
                            {thread.otherUser?.isPro && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">@{thread.otherUser?.username ?? "user"}</p>
                        </div>
                      </div>
                      {thread.otherUser && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={thread.isBlocked ? t("profile.messagesPanel.unblock") : t("profile.messagesPanel.block")}
                          title={thread.isBlocked ? t("profile.messagesPanel.unblock") : t("profile.messagesPanel.block")}
                          onClick={() =>
                            thread.isBlocked
                              ? unblockUser({ blockerId: userId!, blockedId: thread.otherUser!._id })
                              : blockUser({ blockerId: userId!, blockedId: thread.otherUser!._id })
                          }
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div
                      ref={messagesScrollRef}
                      onScroll={handleMessagesScroll}
                      className="relative min-h-0 flex-1 overflow-auto px-4 py-5 font-[var(--font-roboto)] sm:px-8"
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
                      <div className="mb-10 mt-4 flex flex-col items-center text-center">
                        <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} size="lg" />
                        <p className="mt-3 text-lg font-semibold tracking-normal">{thread.otherUser?.name ?? t("profile.messagesPanel.unknownUser")}</p>
                        <p className="text-sm text-muted-foreground">@{thread.otherUser?.username ?? "user"}</p>
                      </div>
                      <div className="space-y-3">
                        {thread.messages.map((message, index) => {
                          const mine = message.senderId === userId;
                          const isPostShare = message.type === "post_share";
                          const isLatest = index === thread.messages.length - 1;
                          return (
                            <div key={message._id} ref={isLatest ? latestMessageRef : undefined} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                              {!mine && <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} size="sm" />}
                              <div className={cn("min-w-0", isPostShare ? "max-w-[19rem] sm:max-w-[22rem]" : "max-w-[82%] sm:max-w-[62%]", mine ? "items-end" : "items-start")}>
                                <div
                                  className={cn(
                                    "text-sm",
                                    isPostShare
                                      ? "p-0"
                                      : cn(
                                          "rounded-[1.25rem] px-4 py-2.5 shadow-sm",
                                          mine
                                            ? "rounded-br-md bg-primary text-[0.95rem] text-primary-foreground"
                                            : "rounded-bl-md bg-white/[0.10] text-[0.95rem] text-foreground"
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
                                <div className={cn("mt-1 flex items-center gap-2 px-1 text-[0.7rem] leading-none text-muted-foreground", mine ? "justify-end" : "justify-start")}>
                                  <span>{new Date(message.createdAt).toLocaleString(locale)}</span>
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

                    <div className="shrink-0 border-t border-white/10 bg-[#0b0d10]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-3 shadow-[0_-16px_40px_rgba(0,0,0,0.22)] backdrop-blur sm:px-5 sm:pb-4">
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
                            "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.075] text-muted-foreground transition-colors hover:bg-white/[0.13] hover:text-foreground",
                            (thread.isBlocked || uploadingMessageImage) && "pointer-events-none opacity-50"
                          )}
                          aria-label={t("profile.messagesPanel.sendImage")}
                          title={t("profile.messagesPanel.sendImage")}
                        >
                          <Paperclip className="h-5 w-5" />
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
                          className="h-10 rounded-full border-white/10 bg-white/[0.075] px-4 text-[0.95rem] shadow-inner shadow-black/10 placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary/45"
                        />
                        <Button size="icon" className="size-10 shrink-0 rounded-full shadow-sm shadow-primary/15" disabled={thread.isBlocked || (!messageBody.trim() && !messageImageDraft)} onClick={() => submitMessage()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 flex items-start gap-1.5 px-1 text-[0.7rem] leading-4 text-muted-foreground/80">
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
        <Card className="border-cyan-500/10 bg-card/95 shadow-lg shadow-cyan-950/5">
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
                    <div key={entry.friendshipId} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-2.5 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-muted/35">
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

        <Card className="border-blue-500/10 bg-card/95 shadow-lg shadow-blue-950/5">
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
                <div key={result._id} className="rounded-xl border border-border bg-muted/20 p-3 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-muted/35">
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
    <section className="rounded-lg border border-border/80 bg-card/45 px-4 py-4 shadow-sm backdrop-blur sm:px-5" aria-label={t("socialPage.createPost")}>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
        <Avatar name={profileName} avatarUrl={avatarUrl} />
        <div className="min-w-0 space-y-3">
          <Textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder={t("socialPage.composerPlaceholder")}
            rows={mediaDraft || body ? 2 : 1}
            maxLength={1200}
            aria-label={t("socialPage.newPost")}
            className="min-h-10 resize-none border-0 bg-transparent px-0 py-1 text-base text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {mediaDraft && (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-background/40">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2 text-xs text-muted-foreground">
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
            <label className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <ImagePlus className="h-4 w-4" />
              <span className="sr-only">{uploading ? t("socialPage.uploadRunning") : t("socialPage.attachMedia")}</span>
              <input type="file" accept="image/*,video/*,.gif" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
            <Button type="button" size="sm" className="min-w-24 rounded-lg font-bold" disabled={disabled} onClick={onSubmit}>
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
  const { t } = useAppPreferences();
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
    <div className="space-y-3">
      {posts.map((post) => {
        const commentBody = commentBodies[post._id] ?? "";
        const showCommentInput = activeCommentPostId === post._id;
        const threadForPost = showCommentInput ? activeThread : undefined;
        const postForCard = {
          ...post,
          mediaStorageId: undefined,
          linkedSubmissionId: undefined,
          repostedByViewer: Boolean(post.repostedByViewer),
          author: post.author ?? {
            _id: post.authorId,
            name: profileName,
            username,
            avatarUrl,
            isPro,
          },
        };
        return (
          <article key={post._id}>
            <SocialPostCard
              post={postForCard}
              userId={userId ?? undefined}
              openPostMenuId={canManagePosts ? openPostMenuId : null}
              editingPostId={editingPostId}
              editingBody={editingPostBodies[post._id] ?? post.body ?? ""}
              onOpenPostMenu={canManagePosts ? onOpenPostMenu : () => undefined}
              onEditPost={() => onEditPost(post)}
              onDeletePost={onDeletePost}
              onEditingBodyChange={(body) => onEditingPostBodyChange(post._id, body)}
              onCancelEdit={() => onCancelPostEdit(post._id)}
              onSaveEdit={() => onSavePostEdit(post)}
              onLike={onLike}
              onComment={onToggleComment}
              onRepost={onRepost}
              onSave={onSave}
              onShare={sharePost}
            />
              {showCommentInput && (
                <div className="mt-4 rounded-[1.25rem] border border-white/[0.08] bg-[#071012]/90 p-4">
                  <div className="flex gap-2">
                    <input
                      id={`profile-comment-${post._id}`}
                      value={commentBody}
                      onChange={(event) => onCommentBodyChange(post._id, event.target.value)}
                      placeholder={t("profile.public.commentPlaceholder")}
                      maxLength={600}
                      className="min-h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
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
        </article>
      );
      })}
    </div>
  );
}

function ProfileMediaGrid({
  posts,
  selectedPostId,
  emptyTitle,
  onToggleComment,
  ...postCardProps
}: {
  posts: ProfilePost[] | undefined;
  selectedPostId: string | null;
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
  const { t } = useAppPreferences();
  const selectedPost = posts?.find((post) => post._id === selectedPostId);

  if (posts === undefined) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">{t("profile.public.postsLoading")}</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-[1.35rem] border border-white/[0.08] bg-[#071012]/90 px-6 py-8 text-center text-sm text-muted-foreground">
        {emptyTitle ?? t("profile.public.mediaEmptyTitle")}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {posts.map((post) => (
          <button
            key={post._id}
            type="button"
            className={cn(
              "group relative aspect-square overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-[#071012] text-left transition hover:-translate-y-0.5 hover:border-primary/45",
              selectedPostId === post._id && "border-primary/70"
            )}
            style={selectedPostId === post._id ? { boxShadow: "0 0 28px color-mix(in oklch, var(--primary) 16%, transparent)" } : undefined}
            onClick={() => onToggleComment(post._id)}
          >
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl ?? ""} className="h-full w-full object-cover opacity-90 transition group-hover:scale-105" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrl ?? ""} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-90" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs font-semibold text-white">
              <span className="truncate">{post.body || post.bodyAfter || t("profile.tabs.media")}</span>
              {post.mediaType === "video" && <Play className="h-4 w-4 shrink-0 fill-white" />}
            </div>
          </button>
        ))}
      </div>

      {selectedPost && (
        <ProfilePostsCard
          {...postCardProps}
          posts={[selectedPost]}
          onToggleComment={onToggleComment}
          emptyTitle={emptyTitle}
        />
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
              className="min-h-16 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60"
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
              className="min-h-9 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60"
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

function TrainingTab({
  trainingGoal,
  favoriteLift,
  trainingSummary,
  templates,
  catalogExercises,
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
  onAcceptTemplateUpdate,
  onKeepTemplateVersion,
}: {
  trainingGoal?: string;
  favoriteLift?: string;
  trainingSummary: ProfileTrainingSummary | null | undefined;
  templates: ProfileWorkoutTemplate[] | undefined;
  catalogExercises: ExerciseCatalogItem[] | undefined;
  ownerView: boolean;
  openTemplateMenuId: string | null;
  editingTemplateId: string | null;
  templateDrafts: Record<string, WorkoutTemplateDraft>;
  onOpenTemplateMenu: (templateId: string | null) => void;
  onEditTemplate: (template: ProfileWorkoutTemplate) => void;
  onDeleteTemplate: (templateId: Id<"workout_templates">) => void;
  onTemplateDraftChange: (templateId: Id<"workout_templates">, draft: Partial<WorkoutTemplateDraft>) => void;
  onCancelTemplateEdit: (templateId: Id<"workout_templates">) => void;
  onSaveTemplateEdit: (template: ProfileWorkoutTemplate) => void;
  onAcceptTemplateUpdate: (templateId: Id<"workout_templates">) => void;
  onKeepTemplateVersion: (templateId: Id<"workout_templates">) => void;
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
          catalogExercises={catalogExercises}
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
          onAcceptTemplateUpdate={onAcceptTemplateUpdate}
          onKeepTemplateVersion={onKeepTemplateVersion}
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

  return (
    <Card className={cn("overflow-hidden border-white/[0.08] bg-[#05090a] shadow-none", embedded && "shadow-none")}>
      <CardContent className="space-y-3 p-0">
        {logs === undefined ? (
          <div className="space-y-3 p-4">
            <div className="h-44 animate-pulse rounded-[1.35rem] border border-white/[0.08] bg-white/[0.04]" />
            <div className="h-32 animate-pulse rounded-[1.35rem] border border-white/[0.08] bg-white/[0.035]" />
          </div>
        ) : logs.length === 0 ? (
          <p className="rounded-[1.35rem] border border-white/[0.08] bg-[#071012]/90 p-6 text-center text-sm text-muted-foreground">
            {t("profile.topLogs.empty")}
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => {
              const exerciseName = log.exerciseName || LIFT_LABELS[log.submission.liftType];
              return (
                <article
                  key={log.submission._id}
                  className={cn(
                    "rounded-[1.35rem] border border-white/[0.08] bg-[#071012]/92 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-primary/35",
                    index === 0 && "border-primary/35"
                  )}
                  style={index === 0 ? { background: "radial-gradient(circle at top right, var(--brand-soft), rgba(7,16,18,0.92) 42%)" } : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary">
                        <Dumbbell className="h-4 w-4" />
                        {index === 0 ? t("profile.topLogs.currentHighlight") : "Top Set"}
                      </div>
                      <h3 className="mt-3 truncate text-lg font-extrabold text-foreground">{exerciseName}</h3>
                      <p className="mt-2 text-4xl font-black leading-none tracking-normal text-primary">
                        {log.submission.weightKg} kg <span className="text-foreground">x</span> {log.submission.reps}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {log.isTopFivePercent && (
                        <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
                          <Sparkles className="h-3 w-3" />
                          Top 5%
                        </Badge>
                      )}
                      {log.rank && (
                        <Badge variant="outline" className="rounded-full border-white/[0.14] bg-white/[0.04]">
                          #{log.rank} {t("profile.topLogs.of")} {log.total}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-3 text-sm text-muted-foreground">
                    <span>{LIFT_LABELS[log.submission.liftType]}</span>
                    <span>{log.submission.bodyweightClass}</span>
                    <span>Score {log.submission.score ?? "-"}</span>
                    <span>{new Date(log.submission.submittedAt).toLocaleDateString(locale)}</span>
                    {log.percentile && <span>{log.percentile}% Percentile</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateUpdateNotice({
  template,
  onAccept,
  onKeep,
}: {
  template: ProfileWorkoutTemplate;
  onAccept: () => void;
  onKeep: () => void;
}) {
  const { t } = useAppPreferences();
  const summary = template.pendingSourceUpdate?.summary ?? [];

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MoveRight className="h-4 w-4 text-primary" />
            {t("profile.playlists.updateAvailable")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("profile.playlists.updateAvailableCopy")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onKeep}>
            {t("profile.playlists.keepOldVersion")}
          </Button>
          <Button type="button" size="sm" onClick={onAccept}>
            {t("profile.playlists.acceptUpdate")}
          </Button>
        </div>
      </div>
      {summary.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          {summary.map((change, index) => (
            <div
              key={`${template._id}-change-${index}`}
              className={cn(
                "grid gap-1 rounded-md border px-2.5 py-2 text-xs sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center",
                change.kind === "added" && "border-emerald-500/25 bg-emerald-500/10",
                change.kind === "removed" && "border-destructive/25 bg-destructive/10",
                change.kind === "changed" && "border-amber-500/25 bg-amber-500/10"
              )}
            >
              <span className="font-semibold">
                {change.kind === "added"
                  ? t("profile.playlists.changeAdded")
                  : change.kind === "removed"
                    ? t("profile.playlists.changeRemoved")
                    : t("profile.playlists.changeChanged")}
              </span>
              <span className="min-w-0 break-words text-muted-foreground">
                {change.beforeName && change.afterName && change.beforeName !== change.afterName
                  ? `${change.beforeName} ${t("profile.playlists.changedTo")} ${change.afterName}`
                  : change.exerciseName}
                {typeof change.beforeSets === "number" || typeof change.afterSets === "number"
                  ? ` · ${change.beforeSets ?? 0} ${t("profile.playlists.setsShort")} ${t("profile.playlists.changedTo")} ${change.afterSets ?? 0} ${t("profile.playlists.setsShort")}`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutTemplatesCard({
  templates,
  catalogExercises,
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
  onAcceptTemplateUpdate,
  onKeepTemplateVersion,
}: {
  templates: ProfileWorkoutTemplate[] | undefined;
  catalogExercises: ExerciseCatalogItem[] | undefined;
  ownerView?: boolean;
  embedded?: boolean;
  openTemplateMenuId: string | null;
  editingTemplateId: string | null;
  templateDrafts: Record<string, WorkoutTemplateDraft>;
  onOpenTemplateMenu: (templateId: string | null) => void;
  onEditTemplate: (template: ProfileWorkoutTemplate) => void;
  onDeleteTemplate: (templateId: Id<"workout_templates">) => void;
  onTemplateDraftChange: (templateId: Id<"workout_templates">, draft: Partial<WorkoutTemplateDraft>) => void;
  onCancelTemplateEdit: (templateId: Id<"workout_templates">) => void;
  onSaveTemplateEdit: (template: ProfileWorkoutTemplate) => void;
  onAcceptTemplateUpdate: (templateId: Id<"workout_templates">) => void;
  onKeepTemplateVersion: (templateId: Id<"workout_templates">) => void;
}) {
  const { locale, t } = useAppPreferences();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [exerciseToAddByTemplate, setExerciseToAddByTemplate] = useState<Record<string, string>>({});

  function draftExerciseFromCatalog(
    exercise: ExerciseCatalogItem,
    fallbackSets?: WorkoutTemplateDraftExercise["sets"]
  ): WorkoutTemplateDraftExercise {
    return {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      sets: fallbackSets && fallbackSets.length > 0 ? fallbackSets : [
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
      ],
    };
  }

  function updateDraftExercises(
    templateId: Id<"workout_templates">,
    exercises: WorkoutTemplateDraftExercise[]
  ) {
    onTemplateDraftChange(templateId, { exercises });
  }

  function replaceDraftExercise(
    templateId: Id<"workout_templates">,
    draft: WorkoutTemplateDraft,
    index: number,
    exerciseId: string
  ) {
    const selected = catalogExercises?.find((exercise) => exercise._id === exerciseId);
    if (!selected) return;
    const next = [...draft.exercises];
    next[index] = draftExerciseFromCatalog(selected, draft.exercises[index]?.sets);
    updateDraftExercises(templateId, next);
  }

  function removeDraftExercise(
    templateId: Id<"workout_templates">,
    draft: WorkoutTemplateDraft,
    index: number
  ) {
    updateDraftExercises(templateId, draft.exercises.filter((_, itemIndex) => itemIndex !== index));
  }

  function addDraftExercise(templateId: Id<"workout_templates">, draft: WorkoutTemplateDraft) {
    const selectedId = exerciseToAddByTemplate[templateId];
    const selected = catalogExercises?.find((exercise) => exercise._id === selectedId);
    if (!selected) return;
    updateDraftExercises(templateId, [...draft.exercises, draftExerciseFromCatalog(selected)]);
    setExerciseToAddByTemplate((current) => ({ ...current, [templateId]: "" }));
  }

  function draftChangesExercises(
    template: ProfileWorkoutTemplate,
    draft: WorkoutTemplateDraft
  ) {
    const current = template.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets.map((set) => ({ reps: set.reps, weight: set.weight ?? 0 })),
    }));
    const next = draft.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets.map((set) => ({ reps: set.reps, weight: set.weight })),
    }));
    return JSON.stringify(current) !== JSON.stringify(next);
  }

  return (
    <Card className={cn("border-blue-500/10 bg-card/95 shadow-xl shadow-blue-950/5", embedded && "shadow-none")}>
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
              exercises: template.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                muscleGroup: exercise.muscleGroup,
                category: exercise.category,
                sets: exercise.sets.map((set) => ({
                  reps: set.reps,
                  weight: set.weight ?? 0,
                })),
              })),
            };

            return (
            <div key={template._id} className="min-w-0 rounded-xl border border-border bg-muted/25 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/40 hover:shadow-lg sm:p-4">
              {ownerView && template.pendingSourceUpdate && !isEditing && (
                <TemplateUpdateNotice
                  template={template}
                  onAccept={() => onAcceptTemplateUpdate(template._id)}
                  onKeep={() => onKeepTemplateVersion(template._id)}
                />
              )}
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
                  <div className="grid gap-2">
                    <div>
                      <Label>{t("profile.playlists.editExercises")}</Label>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("profile.playlists.editExercisesCopy")}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {draft.exercises.map((exercise, index) => (
                        <div key={`${template._id}-draft-${index}-${exercise.exerciseId}`} className="grid gap-2 rounded-lg border border-border bg-muted/30 p-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <select
                            value={exercise.exerciseId}
                            disabled={!catalogExercises || catalogExercises.length === 0}
                            className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                            onChange={(event) => replaceDraftExercise(template._id, draft, index, event.target.value)}
                          >
                            {!catalogExercises || catalogExercises.length === 0 ? (
                              <option value={exercise.exerciseId}>{exercise.exerciseName}</option>
                            ) : (
                              catalogExercises.map((option) => (
                                <option key={option._id} value={option._id}>
                                  {option.name}
                                </option>
                              ))
                            )}
                          </select>
                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <span className="text-xs text-muted-foreground">
                              {exercise.sets.length} Sets
                            </span>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              disabled={draft.exercises.length <= 1}
                              aria-label={t("profile.playlists.removeExercise")}
                              onClick={() => removeDraftExercise(template._id, draft, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        value={exerciseToAddByTemplate[template._id] ?? ""}
                        disabled={!catalogExercises || catalogExercises.length === 0}
                        className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                          setExerciseToAddByTemplate((current) => ({
                            ...current,
                            [template._id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {catalogExercises === undefined
                            ? t("profile.playlists.exerciseCatalogLoading")
                            : t("profile.playlists.chooseExercise")}
                        </option>
                        {catalogExercises?.map((exercise) => (
                          <option key={exercise._id} value={exercise._id}>
                            {exercise.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={!exerciseToAddByTemplate[template._id]}
                        onClick={() => addDraftExercise(template._id, draft)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        {t("profile.playlists.addExercise")}
                      </Button>
                    </div>
                  </div>
                  {draftChangesExercises(template, draft) && (
                    <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{t("profile.playlists.exerciseChangeWarning")}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => onCancelTemplateEdit(template._id)}>
                      {t("profile.misc.cancel")}
                    </Button>
                    <Button type="button" disabled={!draft.name.trim() || draft.exercises.length === 0} onClick={() => onSaveTemplateEdit(template)}>
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
        "group block overflow-hidden rounded-2xl border text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mine
          ? "border-primary/35 bg-[#101215] hover:bg-[#14171b]"
          : "border-white/10 bg-white/[0.055] hover:bg-white/[0.08]"
      )}
    >
      <div className="p-3.5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold", mine ? "border-primary/70 text-primary" : "border-white/20 text-foreground")}>
              {authorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-4">{authorName}</p>
              <p className="truncate text-xs text-muted-foreground">{authorLabel}</p>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide", mine ? "border-primary/25 bg-primary/10 text-primary" : "border-white/10 bg-white/[0.06] text-muted-foreground")}>
            {t("profile.public.sharedPost")}
          </span>
        </div>

        {message.postPreview?.mediaUrl ? (
          <div className="mb-3 overflow-hidden rounded-xl bg-black/40">
            {message.postPreview.mediaType === "video" ? (
              <video src={message.postPreview.mediaUrl} className="aspect-video w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.postPreview.mediaUrl} alt="" className="aspect-video w-full object-cover" />
            )}
          </div>
        ) : null}

        <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-5 text-foreground">
          {excerpt}
        </p>
        <div className="mt-3 flex items-center justify-end border-t border-white/10 pt-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors group-hover:text-primary/90">
            {t("profile.public.viewPost")}
            <ExternalLink className="h-3 w-3" />
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
        className="size-12 rounded-xl border border-white/15 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-white/10 sm:size-14"
        aria-label={t("profile.actions.share")}
        onClick={onShare}
      >
        <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <div className="relative" ref={menuRef}>
        <Button
          size="icon"
          variant="ghost"
          className="relative size-12 rounded-xl border border-white/15 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-white/10 sm:size-14"
          aria-label={t("profile.actions.socialMenu")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
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
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-border/80 bg-popover p-1.5 text-sm text-popover-foreground shadow-2xl shadow-black/45"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => choose(onOpenNetwork)}
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{t("profile.actions.network")}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => choose(onOpenMessages)}
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
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
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
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
    <div className="min-h-[6.4rem] border-r border-border/80 px-1.5 py-4 text-center transition-colors last:border-r-0 hover:bg-muted/30 sm:min-h-32 sm:px-3 sm:py-5" aria-label={`${label}: ${value}${detail ? `, ${detail}` : ""}`}>
      <Icon aria-hidden="true" className={cn("mx-auto mb-2 h-5 w-5 text-muted-foreground sm:mb-3 sm:h-6 sm:w-6", iconClassName)} />
      <p className="truncate text-[1.08rem] font-black leading-tight text-foreground min-[390px]:text-[1.18rem] sm:text-2xl" title={value}>{value}</p>
      <p className="mt-1.5 text-[0.74rem] leading-tight text-muted-foreground min-[390px]:text-[0.8rem] sm:mt-2 sm:text-base">{label}</p>
      {detail && <p className="mt-1 truncate text-[0.72rem] leading-tight text-muted-foreground/80 min-[390px]:text-[0.78rem] sm:text-sm" title={detail}>{detail}</p>}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" | "lg" | "hero" }) {
  const classes =
    size === "hero"
      ? "h-[7.25rem] w-[7.25rem] text-5xl min-[390px]:h-32 min-[390px]:w-32 sm:h-44 sm:w-44 sm:text-7xl"
      : size === "lg"
        ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl"
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


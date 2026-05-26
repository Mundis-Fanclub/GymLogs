"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Ban,
  BadgeCheck,
  Calendar,
  ChevronRight,
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
  PlusCircle,
  Repeat2,
  Ruler,
  Search,
  Send,
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
import { cn } from "@/lib/utils";

const ACCENTS = {
  emerald: "from-emerald-500 via-sky-500 to-slate-950",
  sky: "from-sky-500 via-cyan-400 to-slate-950",
  rose: "from-rose-500 via-orange-400 to-slate-950",
  amber: "from-amber-400 via-lime-500 to-slate-950",
  violet: "from-violet-500 via-fuchsia-400 to-slate-950",
} as const;

type Accent = keyof typeof ACCENTS;

const ACCENT_OPTIONS: Array<{ value: Accent; label: string }> = [
  { value: "emerald", label: "Emerald Pulse" },
  { value: "sky", label: "Arctic Sky" },
  { value: "rose", label: "Rose Heat" },
  { value: "amber", label: "Amber Sprint" },
  { value: "violet", label: "Violet Neon" },
];

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
  profileAccent: Accent;
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

type ProfileTab = "posts" | "saved" | "logs" | "workouts" | "playlists" | "about" | "messages" | "network";

export function ProfilePageClient() {
  const { userId, isLoaded } = useConvexUser();
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
  const isOwnProfile = Boolean(userId && user?._id === userId);
  const posts = useQuery(api.social.listByAuthor, userId && loadSecondary ? { authorId: userId, viewerId: userId, limit: 30 } : "skip");
  const savedPosts = useQuery(api.social.listSaved, userId && isOwnProfile && loadSecondary ? { userId, limit: 30 } : "skip");
  const friends = useQuery(api.friends.list, userId && loadSecondary ? { userId } : "skip");
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const createProfilePost = useMutation(api.social.createPost);
  const generatePostUploadUrl = useMutation(api.social.generateUploadUrl);
  const togglePostLike = useMutation(api.social.toggleLike);
  const togglePostSave = useMutation(api.social.toggleSave);
  const addProfilePostComment = useMutation(api.social.addComment);
  const addFriend = useMutation(api.friends.addByUsername);
  const removeFriend = useMutation(api.friends.remove);
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
  const [messageImageDraft, setMessageImageDraft] = useState<MessageImageDraft | null>(null);
  const [messageUploadError, setMessageUploadError] = useState("");
  const [uploadingMessageImage, setUploadingMessageImage] = useState(false);
  const [profilePostBody, setProfilePostBody] = useState("");
  const [profilePostCommentBodies, setProfilePostCommentBodies] = useState<Record<string, string>>({});
  const [activeProfileCommentPostId, setActiveProfileCommentPostId] = useState<string | null>(null);
  const [profilePostMediaDraft, setProfilePostMediaDraft] = useState<ProfilePostMediaDraft | null>(null);
  const [profilePostError, setProfilePostError] = useState("");
  const [uploadingProfilePostMedia, setUploadingProfilePostMedia] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<Id<"messages"> | null>(null);
  const [reportReason, setReportReason] = useState("Spam oder wiederholte Nachrichten");
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
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
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
    profileAccent: "emerald" as Accent,
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
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoadSecondary(true), 120);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function selectTabFromHash() {
      const hash = window.location.hash;
      if (hash === "#messages") setActiveProfileTab("messages");
      if (hash === "#network" || hash === "#friends") setActiveProfileTab("network");
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
      profileAccent: (user.profileAccent ?? "emerald") as Accent,
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
    });
    setAvatarPreviewUrl("");
    setCoverPreviewUrl("");
  }, [user]);

  useEffect(() => {
    if (!userId || !activeConversation) return;
    void markRead({ userId, conversationId: activeConversation });
  }, [activeConversation, markRead, userId, thread?.messages.length]);

  useEffect(() => {
    if (!isOwnProfile && activeProfileTab === "saved") {
      setActiveProfileTab("posts");
    }
  }, [activeProfileTab, isOwnProfile]);

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
  const accentClass = ACCENTS[form.profileAccent] ?? ACCENTS.emerald;
  const displayAvatarUrl = avatarPreviewUrl || form.avatarUrl;
  const displayCoverUrl = coverPreviewUrl || form.coverUrl;
  const visibleProfile = publicPreview ?? user;
  const trainingSummary = publicPreview?.trainingSummary;
  const topLog = topLogs?.[0];
  const bestSet = trainingSummary?.bestSet;
  const primaryLift = bestSet
    ? `${bestSet.weight} kg x ${bestSet.reps}`
    : topLog
      ? `${topLog.submission.weightKg} kg x ${topLog.submission.reps}`
      : null;
  const primaryLiftLabel =
    bestSet?.exerciseName ??
    topLog?.exerciseName ??
    form.favoriteLift ??
    "Top Lift";
  const streakDays = String(trainingSummary?.currentStreakDays ?? 0);
  const weeklyActivityValue = trainingSummary ? `${trainingSummary.averageWorkoutsPerWeek} / Woche` : "5 / Woche";
  const volumeThirtyDays = trainingSummary
    ? `${Math.round(trainingSummary.totalVolume).toLocaleString("de-DE")} kg`
    : "2.997 kg";
  const joinedLabel = user?._creationTime
    ? `Seit ${new Date(user._creationTime).toLocaleDateString("de-DE", {
        month: "short",
        year: "numeric",
      })}`
    : "Seit kurzem";
  const profileMeta = [
    visibleProfile?.location ? { icon: MapPin, value: visibleProfile.location } : null,
    visibleProfile?.heightCm ? { icon: Ruler, value: `${visibleProfile.heightCm} cm` } : null,
    { icon: Calendar, value: joinedLabel },
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; value: string }>;
  const profileTabs = [
    { id: "posts", label: "Beiträge" },
    ...(isOwnProfile ? [{ id: "saved", label: "Gespeichert" } as const] : []),
    { id: "logs", label: "Top Logs" },
    { id: "workouts", label: "Workouts" },
    { id: "playlists", label: "Playlists" },
    { id: "messages", label: "Nachrichten" },
    { id: "network", label: "Netzwerk" },
    { id: "about", label: "Über mich" },
  ] satisfies Array<{ id: ProfileTab; label: string }>;

  if (isLoaded && !userId) {
    return (
      <EmptyState
        icon={User}
        title="Profil nur mit Login"
        description="Melde dich an, um dein Profil zu bearbeiten."
        action={
          <Link href="/sign-in">
            <Button>Anmelden</Button>
          </Link>
        }
      />
    );
  }

  async function saveProfile() {
    if (!userId) return;
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
      favoriteLift: form.favoriteLift || undefined,
      trainingGoal: form.trainingGoal || undefined,
      profileAccent: form.profileAccent,
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
        trainingSummary: form.publicTrainingSummary,
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
      setUploadError("Bitte wähle eine Bilddatei aus.");
      return;
    }
    const maxSize = kind === "avatar" ? 4 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(kind === "avatar" ? "Profilbild max. 4 MB." : "Hintergrund max. 8 MB.");
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
      if (!result.ok) throw new Error("Upload fehlgeschlagen.");
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
      setUploadError(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
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
      setProfilePostError(postError instanceof Error ? postError.message : "Beitrag konnte nicht erstellt werden.");
    }
  }

  async function submitProfilePostComment(postId: Id<"social_posts">) {
    if (!userId) return;
    const body = profilePostCommentBodies[postId]?.trim();
    if (!body) return;
    await addProfilePostComment({ userId, postId, body });
    setProfilePostCommentBodies((current) => ({ ...current, [postId]: "" }));
    setActiveProfileCommentPostId(null);
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
    setReportReason("Spam oder wiederholte Nachrichten");
  }

  async function shareProfile() {
    const profilePath = userId ? `/profile/${userId}` : "/profile";
    const profileUrl = `${window.location.origin}${profilePath}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: form.name || "GymLogs Profil",
          text: form.bio || "Mein GymLogs Profil",
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
      : "url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80)",
  };

  return (
    <div className="-mx-3 -mt-3 bg-[#050708] pb-8 text-white sm:mx-auto sm:mt-0 sm:max-w-[56rem] sm:overflow-hidden sm:rounded-lg sm:border sm:border-white/10">
      <div className="space-y-0">
        <Card className="overflow-hidden rounded-none border-0 bg-[#050708] py-0 text-white ring-0 shadow-none">
          <div
            className="relative min-h-[28.5rem] overflow-hidden bg-cover bg-center sm:min-h-[32rem]"
            style={profileCoverStyle}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_36%,rgba(34,211,238,0.24),transparent_21%),linear-gradient(180deg,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.42)_26%,rgba(1,4,10,0.93)_82%,#050708_100%)]" />
            <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between sm:left-7 sm:right-7 sm:top-6">
              <Button size="icon" variant="ghost" className="size-9 rounded-full text-white hover:bg-white/10 sm:size-11" aria-label="Zurück" onClick={() => history.back()}>
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <div className="flex items-center gap-3 sm:gap-5">
                <Button size="icon" variant="ghost" className="size-9 rounded-full text-white hover:bg-white/10 sm:size-11" aria-label="Profil teilen" onClick={shareProfile}>
                  <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button size="icon" variant="ghost" className="size-9 rounded-full text-white hover:bg-white/10 sm:size-11" aria-label="Freunde anzeigen" onClick={() => setActiveProfileTab("network")}>
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-9 sm:pb-8">
              <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-5 min-[390px]:gap-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
                <div className="relative size-24 self-start min-[390px]:size-28 sm:size-44">
                  <div className="pointer-events-none absolute -inset-2 rounded-full bg-cyan-300/25 blur-2xl" />
                  <Avatar name={form.name} avatarUrl={displayAvatarUrl} size="hero" />
                </div>
                <div className="min-w-0">
                  <Badge className="mb-2 rounded-full border-cyan-300/20 bg-cyan-300/20 px-2.5 py-0.5 text-[0.68rem] text-cyan-200 shadow-lg shadow-cyan-950/30 sm:mb-4 sm:px-4 sm:py-1 sm:text-sm">
                    Öffentliches Profil
                  </Badge>
                  <h1 className="flex min-w-0 items-center gap-2 text-[2rem] font-black leading-none tracking-normal min-[390px]:text-[2.25rem] sm:text-6xl">
                    <span className="truncate">{form.name || "Steffen"}</span>
                    <BadgeCheck className="h-7 w-7 shrink-0 fill-sky-400 text-black sm:h-10 sm:w-10" />
                  </h1>
                  <p className="mt-2 text-[1.12rem] leading-tight text-white/70 min-[390px]:text-[1.25rem] sm:text-2xl">@{form.username || "shaker1"}</p>
                  <p className="mt-4 max-w-[34rem] whitespace-pre-wrap text-[1rem] font-semibold leading-[1.35] text-white min-[390px]:text-[1.08rem] sm:mt-8 sm:text-3xl">
                    {visibleProfile?.bio || "Disziplin heute, Stärke morgen.\nBaue meine beste Version."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[0.85rem] text-white/62 min-[390px]:text-[0.95rem] sm:mt-8 sm:gap-x-8 sm:text-xl">
                    {(profileMeta.length ? profileMeta : [{ icon: MapPin, value: "T-Bar Gym" }, { icon: Ruler, value: "178 cm" }, { icon: Calendar, value: joinedLabel }]).map(({ icon: Icon, value }) => (
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
          <CardContent className="relative z-10 space-y-4 bg-[#050708] px-5 pb-7 pt-0 sm:space-y-6 sm:px-9">
            <div className="grid gap-2.5 sm:max-w-xl sm:gap-3">
              <Button type="button" className="h-12 rounded-lg bg-cyan-300 text-base font-semibold text-black shadow-sm shadow-cyan-950/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-200 sm:h-14 sm:text-lg" onClick={() => setEditProfileOpen(true)}>
                Profil bearbeiten
              </Button>
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.025] shadow-sm shadow-black/10 min-[420px]:grid-cols-4">
              <ProfileMetric icon={Flame} iconClassName="text-orange-400" value={streakDays} label="Tage Streak" />
              <ProfileMetric icon={Dumbbell} value={primaryLift ?? "43 kg x 8"} label="Top Lift" detail={primaryLiftLabel || "Push-up"} />
              <ProfileMetric icon={Activity} iconClassName="text-cyan-300" value={weeklyActivityValue} label="ø Aktivität" />
              <ProfileMetric icon={Users} iconClassName="text-cyan-100" value={volumeThirtyDays} label="Volumen (30 Tage)" />
            </div>
            <div className="overflow-x-auto border-b border-white/10">
              <div className="flex min-w-max justify-between gap-7 sm:gap-9">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveProfileTab(tab.id)}
                    className={cn(
                      "relative min-h-12 whitespace-nowrap px-1 text-base font-semibold text-white/45 transition-colors hover:text-white sm:min-h-16 sm:text-2xl",
                      activeProfileTab === tab.id && "text-white"
                    )}
                  >
                    {tab.label}
                    {activeProfileTab === tab.id && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-cyan-300" />
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
                commentBodies={profilePostCommentBodies}
                activeCommentPostId={activeProfileCommentPostId}
                onLike={(postId) => userId && togglePostLike({ userId, postId })}
                onSave={(postId) => userId && togglePostSave({ userId, postId })}
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
                commentBodies={profilePostCommentBodies}
                activeCommentPostId={activeProfileCommentPostId}
                onLike={(postId) => userId && togglePostLike({ userId, postId })}
                onSave={(postId) => userId && togglePostSave({ userId, postId })}
                onToggleComment={(postId) =>
                  setActiveProfileCommentPostId((current) => current === postId ? null : postId)
                }
                onCommentBodyChange={(postId, body) =>
                  setProfilePostCommentBodies((current) => ({ ...current, [postId]: body }))
                }
                onSubmitComment={submitProfilePostComment}
                emptyTitle="Noch keine gespeicherten Beitraege"
              />
            )}
            {activeProfileTab === "logs" && <TopLogsCard logs={topLogs} embedded />}
            {activeProfileTab === "workouts" && (
              <WorkoutSummaryCard
                trainingGoal={visibleProfile?.trainingGoal}
                favoriteLift={visibleProfile?.favoriteLift || primaryLiftLabel}
                trainingSummary={trainingSummary}
              />
            )}
            {activeProfileTab === "playlists" && (
              <WorkoutTemplatesCard templates={workoutTemplates} ownerView embedded />
            )}
            {activeProfileTab === "about" && (
              <AboutProfileCard profile={visibleProfile} form={form} primaryLiftLabel={primaryLiftLabel} />
            )}
            <div className="hidden">
              {visibleProfile?.heightCm && <QuickStat label="Größe" value={`${visibleProfile.heightCm} cm`} />}
              {visibleProfile?.weightKg && <QuickStat label="Gewicht" value={`${visibleProfile.weightKg} kg`} />}
              {visibleProfile?.birthDate && (
                <QuickStat label="Geburtsdatum" value={new Date(visibleProfile.birthDate).toLocaleDateString("de-DE")} />
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

        <Dialog
          open={editProfileOpen}
          onOpenChange={(open) => {
            setEditProfileOpen(open);
            if (!open) setProfileEditMode("edit");
          }}
        >
          <DialogContent className="z-[100] h-[100dvh] max-h-[100dvh] w-screen max-w-none overflow-hidden rounded-none border-white/10 bg-[#050708] p-0 text-white shadow-2xl shadow-cyan-950/25 sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-4xl sm:rounded-xl">
            <div className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden sm:max-h-[92vh]">
              <div className="relative min-h-[17rem] overflow-visible bg-cover bg-center sm:min-h-52" style={profileCoverStyle}>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35),#050708_92%)]" />
                <DialogHeader className="relative z-10 flex-col items-start gap-3 space-y-0 p-4 pr-12 sm:flex-row sm:justify-between sm:p-7">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl font-black text-white sm:text-3xl">Profil bearbeiten</DialogTitle>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-white/62 sm:text-sm">
                      Passe Cover, Profilinfos und Sichtbarkeit an. Die Vorschau nutzt deine aktuellen Eingaben.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 border-white/15 bg-white/[0.04] text-white hover:bg-white/10 sm:h-10"
                    onClick={() => setProfileEditMode((mode) => mode === "preview" ? "edit" : "preview")}
                  >
                    <Eye className="h-4 w-4" />
                    {profileEditMode === "preview" ? "Bearbeiten" : "Vorschau"}
                  </Button>
                </DialogHeader>
                {profileEditMode === "edit" && (
                  <div className="absolute left-4 right-4 top-[7.35rem] z-20 flex justify-end sm:left-auto sm:right-7 sm:top-24">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="max-w-full border-white/20 bg-black/45 text-white backdrop-blur hover:bg-black/60"
                      disabled={uploading === "cover"}
                      onClick={() => coverFileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {uploading === "cover" ? "Upload läuft..." : "Hintergrund bearbeiten"}
                    </Button>
                  </div>
                )}
                <div className="relative z-10 grid grid-cols-[4.5rem_minmax(0,1fr)] items-end gap-3 px-4 pb-4 pt-16 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4 sm:px-7 sm:pb-5 sm:pt-0">
                  <div className="relative">
                    <button
                      type="button"
                      className="block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Profilbild bearbeiten"
                      onClick={() => profileEditMode === "edit" && setAvatarMenuOpen((open) => !open)}
                    >
                      <Avatar name={form.name} avatarUrl={displayAvatarUrl} size="hero" />
                    </button>
                    {profileEditMode === "edit" && avatarMenuOpen && (
                      <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 min-w-56 overflow-hidden rounded-lg border border-white/10 bg-[#0d1115] p-1 text-sm shadow-2xl shadow-black/50">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-white hover:bg-white/10"
                          onClick={() => avatarFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Bild hochladen
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-400 hover:bg-red-500/10"
                          onClick={() => removeProfileImage("avatar")}
                        >
                          <Trash2 className="h-4 w-4" />
                          Aktuelles Bild entfernen
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <h2 className="truncate text-2xl font-black leading-none sm:text-5xl">{form.name || "GymLogs User"}</h2>
                    <p className="mt-1 truncate text-sm text-white/68 sm:text-lg">@{form.username || "username"}</p>
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

              <div className="space-y-4 px-4 pb-[calc(env(safe-area-inset-bottom)+7.75rem)] sm:px-7 sm:pb-7">
                {profileEditMode === "preview" ? (
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
                    <div className="p-5">
                      <p className="whitespace-pre-wrap text-lg font-semibold leading-7 text-white">
                        {form.bio || "Noch keine Bio eingetragen."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/62">
                        {form.location && <Badge variant="secondary" className="bg-white/10 text-white"><MapPin className="h-3 w-3" />{form.location}</Badge>}
                        {form.favoriteLift && <Badge variant="secondary" className="bg-white/10 text-white"><Dumbbell className="h-3 w-3" />{form.favoriteLift}</Badge>}
                        {form.heightCm && <Badge variant="secondary" className="bg-white/10 text-white"><Ruler className="h-3 w-3" />{form.heightCm} cm</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-t border-white/10 min-[420px]:grid-cols-4">
                      <ProfileMetric icon={Flame} iconClassName="text-orange-400" value={streakDays} label="Tage Streak" />
                      <ProfileMetric icon={Dumbbell} value={primaryLift ?? "0 kg"} label="Top Lift" detail={primaryLiftLabel} />
                      <ProfileMetric icon={Activity} iconClassName="text-cyan-300" value={weeklyActivityValue} label="Aktivität" />
                      <ProfileMetric icon={Users} iconClassName="text-cyan-100" value={volumeThirtyDays} label="Volumen" />
                    </div>
                  </div>
                ) : (
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-4">
                      <div className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:grid-cols-2 sm:p-4">
                        <Field label="Name">
                          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                        </Field>
                        <Field label="Username">
                          <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                        </Field>
                        <PublicField label="Ort" checked={form.publicLocation} onChange={(checked) => setForm({ ...form, publicLocation: checked })}>
                          <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                        </PublicField>
                        <PublicField label="Lieblingslift" checked={form.publicFavoriteLift} onChange={(checked) => setForm({ ...form, publicFavoriteLift: checked })}>
                          <Input value={form.favoriteLift} onChange={(event) => setForm({ ...form, favoriteLift: event.target.value })} />
                        </PublicField>
                        <div className="sm:col-span-2">
                          <PublicFieldLabel label="Bio" checked={form.publicBio} onChange={(checked) => setForm({ ...form, publicBio: checked })} />
                          <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} maxLength={180} />
                        </div>
                        <div className="sm:col-span-2">
                          <PublicFieldLabel label="Trainingsziel" checked={form.publicTrainingGoal} onChange={(checked) => setForm({ ...form, publicTrainingGoal: checked })} />
                          <Textarea value={form.trainingGoal} onChange={(event) => setForm({ ...form, trainingGoal: event.target.value })} rows={2} maxLength={120} />
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:grid-cols-2 sm:p-4">
                        <Field label="Avatar URL Fallback">
                          <Input placeholder="https://..." value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value, avatarStorageId: undefined })} />
                        </Field>
                        <Field label="Cover URL Fallback">
                          <Input placeholder="https://..." value={form.coverUrl} onChange={(event) => setForm({ ...form, coverUrl: event.target.value, coverStorageId: undefined })} />
                        </Field>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:p-4">
                        <PublicField label="Größe in cm" checked={form.publicHeight} onChange={(checked) => setForm({ ...form, publicHeight: checked })}>
                          <Input inputMode="decimal" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} />
                        </PublicField>
                        <PublicField label="Gewicht in kg" checked={form.publicWeight} onChange={(checked) => setForm({ ...form, publicWeight: checked })}>
                          <Input inputMode="decimal" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} />
                        </PublicField>
                        <PublicField label="Geburtsdatum" checked={form.publicBirthDate} onChange={(checked) => setForm({ ...form, publicBirthDate: checked })}>
                          <Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
                        </PublicField>
                        <Field label="Akzent">
                          <AccentSelect value={form.profileAccent} onChange={(profileAccent) => setForm({ ...form, profileAccent })} />
                        </Field>
                      </div>

                      <div className="grid min-w-0 gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-3 sm:p-4">
                        <ProfileVisibilitySelect value={form.isPublic ? "public" : "private"} onChange={(value) => setForm({ ...form, isPublic: value === "public" })} />
                        <PrivacyToggle label="Nachrichten erlauben" checked={form.allowMessages} onChange={(checked) => setForm({ ...form, allowMessages: checked })} />
                        <PrivacyToggle label="Training zeigen" checked={form.showTrainingSummary} onChange={(checked) => setForm({ ...form, showTrainingSummary: checked })} />
                        <PrivacyToggle label="Training öffentlich" checked={form.publicTrainingSummary} onChange={(checked) => setForm({ ...form, publicTrainingSummary: checked })} />
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                <div className="fixed inset-x-0 bottom-0 z-[110] flex flex-col gap-2 border-t border-white/10 bg-[#050708]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:sticky sm:-mx-7 sm:flex-row sm:items-center sm:justify-end sm:px-7 sm:py-4">
                  <Button type="button" variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10" onClick={() => setProfileEditMode((mode) => mode === "preview" ? "edit" : "preview")}>
                    <Eye className="h-4 w-4" />
                    {profileEditMode === "preview" ? "Zurück bearbeiten" : "Vorschau"}
                  </Button>
                  <Button className="bg-cyan-300 text-black hover:bg-cyan-200" onClick={saveProfile}>Profil speichern</Button>
                  {saved && <span className="self-center text-sm text-emerald-400">Gespeichert</span>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {false && (
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Profil bearbeiten</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Avatar, Cover, Trainingssignal und Sichtbarkeit an einer Stelle.
            </p>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            </Field>
            <MediaUpload
              label="Profilbild"
              description="Quadratisches Bild, max. 4 MB"
              uploading={uploading === "avatar"}
              onFile={(file) => uploadProfileImage(file, "avatar")}
            />
            <MediaUpload
              label="Hintergrund"
              description="Breites Coverbild, max. 8 MB"
              uploading={uploading === "cover"}
              onFile={(file) => uploadProfileImage(file, "cover")}
            />
            <Field label="Avatar URL Fallback">
              <Input
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(event) =>
                  setForm({ ...form, avatarUrl: event.target.value, avatarStorageId: undefined })
                }
              />
            </Field>
            <Field label="Cover URL Fallback">
              <Input
                placeholder="https://..."
                value={form.coverUrl}
                onChange={(event) =>
                  setForm({ ...form, coverUrl: event.target.value, coverStorageId: undefined })
                }
              />
            </Field>
            {uploadError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
                {uploadError}
              </p>
            )}
            <Field label="Ort">
              <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </Field>
            <Field label="Lieblingslift">
              <Input value={form.favoriteLift} onChange={(event) => setForm({ ...form, favoriteLift: event.target.value })} />
            </Field>
            <Field label="Größe in cm">
              <Input inputMode="decimal" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} />
            </Field>
            <Field label="Gewicht in kg">
              <Input inputMode="decimal" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} />
            </Field>
            <Field label="Geburtsdatum">
              <Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
            </Field>
            <Field label="Akzent">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ACCENTS) as Accent[]).map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    aria-label={`${accent} accent`}
                    onClick={() => setForm({ ...form, profileAccent: accent })}
                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${ACCENTS[accent]} ring-offset-2 ring-offset-background ${
                      form.profileAccent === accent ? "ring-2 ring-ring" : ""
                    }`}
                  />
                ))}
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} maxLength={180} />
            </div>
            <div className="sm:col-span-2">
              <Label>Trainingsziel</Label>
              <Textarea value={form.trainingGoal} onChange={(event) => setForm({ ...form, trainingGoal: event.target.value })} rows={2} maxLength={120} />
            </div>
            <PrivacyToggle label="Öffentliches Profil" checked={form.isPublic} onChange={(checked) => setForm({ ...form, isPublic: checked })} />
            <PrivacyToggle label="Nachrichten erlauben" checked={form.allowMessages} onChange={(checked) => setForm({ ...form, allowMessages: checked })} />
            <PrivacyToggle label="Trainingszusammenfassung zeigen" checked={form.showTrainingSummary} onChange={(checked) => setForm({ ...form, showTrainingSummary: checked })} />
            <PrivacyToggle label="Größe öffentlich" checked={form.publicHeight} onChange={(checked) => setForm({ ...form, publicHeight: checked })} />
            <PrivacyToggle label="Gewicht öffentlich" checked={form.publicWeight} onChange={(checked) => setForm({ ...form, publicWeight: checked })} />
            <PrivacyToggle label="Geburtsdatum öffentlich" checked={form.publicBirthDate} onChange={(checked) => setForm({ ...form, publicBirthDate: checked })} />
            <PrivacyToggle label="Training öffentlich" checked={form.publicTrainingSummary} onChange={(checked) => setForm({ ...form, publicTrainingSummary: checked })} />
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
              <Button onClick={saveProfile}>Profil speichern</Button>
              {saved && <span className="self-center text-sm text-emerald-500">Gespeichert</span>}
            </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        <Card
          id="messages"
          className={cn(
            "scroll-mt-24 overflow-hidden border-cyan-500/10 bg-card/95 shadow-xl shadow-cyan-950/5",
            activeProfileTab !== "messages" && "hidden"
          )}
        >
          <CardHeader className="border-b border-border/70 bg-muted/10">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Nachrichten
              {unreadTotal > 0 && <Badge>{unreadTotal} ungelesen</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-3.5 sm:p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
              {conversations === undefined ? (
                <p className="text-sm text-muted-foreground">Nachrichten werden geladen...</p>
              ) : conversations.length === 0 ? (
                <ProfileEmpty icon={MessageCircle} title="Noch keine Nachrichten" copy="Wenn du Beiträge teilst oder Freunde anschreibst, entsteht hier dein Social-Inbox-Verlauf." />
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setActiveConversation(conversation._id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activeConversation === conversation._id
                        ? "border-primary bg-primary/10"
                        : conversation.unreadCount > 0
                          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-muted/30 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={conversation.otherUser?.name ?? "?"} avatarUrl={conversation.otherUser?.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1 truncate font-medium">
                            <span className="truncate">{conversation.otherUser?.name ?? "Unbekannt"}</span>
                            {conversation.otherUser?.isPro && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                          </p>
                          {conversation.unreadCount > 0 && <Badge>{conversation.unreadCount}</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{conversation.lastMessagePreview ?? "Neue Unterhaltung"}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="min-h-[28rem] overflow-hidden rounded-lg border border-border bg-background">
              {!thread ? (
                <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 text-cyan-300" />
                  Wähle eine Unterhaltung aus.
                </div>
              ) : (
                <div className="flex min-h-[28rem] flex-col">
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={thread.otherUser?.name ?? "?"} avatarUrl={thread.otherUser?.avatarUrl} />
                      <div>
                        <p className="flex items-center gap-1 font-medium">
                          {thread.otherUser?.name ?? "Unbekannt"}
                          {thread.otherUser?.isPro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">@{thread.otherUser?.username ?? "user"}</p>
                      </div>
                    </div>
                    {thread.otherUser && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            thread.isBlocked
                              ? unblockUser({ blockerId: userId!, blockedId: thread.otherUser!._id })
                              : blockUser({ blockerId: userId!, blockedId: thread.otherUser!._id })
                          }
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {thread.isBlocked ? "Entblocken" : "Blockieren"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3 overflow-auto bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_35%)] p-3 sm:p-4">
                    {thread.messages.map((message) => {
                      const mine = message.senderId === userId;
                      return (
                        <div key={message._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[88%] rounded-2xl border px-3 py-2.5 text-sm shadow-sm sm:max-w-[76%]",
                              mine
                                ? "rounded-br-md border-primary/30 bg-primary text-primary-foreground shadow-primary/10"
                                : message.readAt
                                  ? "rounded-bl-md border-border bg-card"
                                  : "rounded-bl-md border-primary/30 bg-muted/70"
                            )}
                          >
                            {message.type === "post_share" ? (
                              <PostShareCard message={message} mine={mine} />
                            ) : message.type === "image" ? (
                              <ImageMessage message={message} />
                            ) : (
                              <p className="whitespace-pre-wrap break-words leading-5">{message.body}</p>
                            )}
                            <div className={cn("mt-2 flex items-center justify-between gap-3 text-[0.7rem]", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
                              <span>{new Date(message.createdAt).toLocaleString("de-DE")}</span>
                              {mine ? <span>{message.readAt ? "Gelesen" : "Ungelesen"}</span> : (
                                <button type="button" className="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setReportedMessage(message._id)}>
                                  <Flag className="h-3 w-3" />
                                  Melden
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {reportedMessage && (
                    <div className="border-t border-border bg-muted/30 p-3">
                      <Label>Meldegrund</Label>
                      <Input value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="destructive" onClick={submitReport}>Melden</Button>
                        <Button size="sm" variant="outline" onClick={() => setReportedMessage(null)}>Abbrechen</Button>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border bg-card/60 p-3">
                    {messageImageDraft && (
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-background p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={messageImageDraft.url} alt="" className="h-14 w-14 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{messageImageDraft.name}</p>
                          <p className="text-xs text-muted-foreground">Bild wird als Nachricht gesendet.</p>
                        </div>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Bild entfernen" onClick={clearMessageImageDraft}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {messageUploadError && <p className="mb-2 text-xs text-destructive">{messageUploadError}</p>}
                    <div className="flex gap-2">
                      <label
                        className={cn(
                          "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-sm transition-colors hover:bg-muted sm:size-8",
                          (thread.isBlocked || uploadingMessageImage) && "pointer-events-none opacity-50"
                        )}
                        aria-label="Bild senden"
                        title="Bild senden"
                      >
                          <Paperclip className="h-4 w-4" />
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
                        placeholder={thread.isBlocked ? "Du hast diese Person blockiert." : "Nachricht schreiben..."}
                        onChange={(event) => setMessageBody(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void submitMessage();
                          }
                        }}
                        maxLength={600}
                      />
                      <Button size="icon" disabled={thread.isBlocked || (!messageBody.trim() && !messageImageDraft)} onClick={() => submitMessage()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Spam-Schutz: Rate Limits, Duplicate-Check und Link-Limit laufen serverseitig.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside
        id="network"
        className={cn(
          "scroll-mt-24 space-y-5",
          activeProfileTab !== "network" && "hidden"
        )}
      >
        <Card className="border-cyan-500/10 bg-card/95 shadow-lg shadow-cyan-950/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Freunde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Per Username hinzufügen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="username"
                  value={friendUsername}
                  onChange={(event) => setFriendUsername(event.target.value)}
                />
                <Button
                  size="icon"
                  className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                  onClick={async () => {
                    if (!userId || !friendUsername.trim()) return;
                    setFriendError("");
                    try {
                      await addFriend({ userId, username: friendUsername });
                      setFriendUsername("");
                    } catch (error) {
                      setFriendError(error instanceof Error ? error.message : "Konnte Freund nicht hinzufügen.");
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
                <p className="text-sm text-muted-foreground">Freunde werden geladen...</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Freunde hinzugefügt.</p>
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
              Nutzer finden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Name oder Username" value={query} onChange={(event) => setQuery(event.target.value)} />
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
                    Nachricht
                  </Button>
                </div>
              ))}
            </div>
            {messageTarget && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Label>Neue Nachricht</Label>
                <Textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={3} maxLength={600} />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => submitMessage(messageTarget)}>Senden</Button>
                  <Button size="sm" variant="outline" onClick={() => setMessageTarget(null)}>Abbrechen</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-cyan-500/10 bg-card/95 shadow-lg shadow-cyan-950/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Datenschutzvorschau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`rounded-xl bg-gradient-to-br ${accentClass} p-4 text-white shadow-lg shadow-cyan-950/15`}>
              <div className="flex items-center gap-3">
                <Avatar name={form.name} avatarUrl={displayAvatarUrl} />
                <div>
                  <p className="font-medium">{form.name || "GymLogs User"}</p>
                  <p className="text-xs text-white/80">@{form.username || "username"}</p>
                </div>
              </div>
              {form.bio && <p className="mt-3 text-sm text-white/90">{form.bio}</p>}
            </div>
            <PreviewRow label="Profil" value={form.isPublic ? "sichtbar" : "privat"} />
            <PreviewRow label="Nachrichten" value={form.allowMessages ? "erlaubt" : "aus"} />
            <PreviewRow label="Größe" value={form.publicHeight ? `${form.heightCm || "-"} cm` : "privat"} />
            <PreviewRow label="Gewicht" value={form.publicWeight ? `${form.weightKg || "-"} kg` : "privat"} />
            <PreviewRow label="Training" value={form.publicTrainingSummary && form.showTrainingSummary ? "sichtbar" : "privat"} />
            {publicPreview?.trainingSummary && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="mb-2 flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-4 w-4" />
                  Öffentliche Trainingskarte
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <QuickStat label="Workouts" value={String(publicPreview.trainingSummary.completedWorkouts)} />
                  <QuickStat label="Sets" value={String(publicPreview.trainingSummary.totalSets)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
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
  return (
    <section className="border-y border-white/10 bg-[#050708] px-6 py-4 sm:px-8" aria-label="Beitrag erstellen">
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3">
        <Avatar name={profileName} avatarUrl={avatarUrl} />
        <div className="min-w-0 space-y-3">
          <Textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="Was gibt's Neues?"
            rows={mediaDraft || body ? 2 : 1}
            maxLength={1200}
            aria-label="Neuen Beitrag schreiben"
            className="min-h-10 resize-none border-0 bg-transparent px-0 py-1 text-base text-white placeholder:text-white/45 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {mediaDraft && (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-xs text-white/55">
                <span className="truncate">{mediaDraft.name}</span>
                <Button type="button" size="icon-xs" variant="ghost" aria-label="Medium entfernen" onClick={onClearMedia}>
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
              <span className="sr-only">{uploading ? "Upload läuft" : "Bild oder Video anhängen"}</span>
              <input type="file" accept="image/*,video/*,.gif" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
            <Button type="button" size="sm" className="bg-cyan-300 text-black hover:bg-cyan-200" disabled={disabled} onClick={onSubmit}>
              Posten
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
  commentBodies,
  activeCommentPostId,
  onLike,
  onSave,
  onToggleComment,
  onCommentBodyChange,
  onSubmitComment,
  emptyTitle = "Noch keine Beitraege",
}: {
  posts: ProfilePost[] | undefined;
  profileName: string;
  username: string;
  avatarUrl?: string;
  isPro: boolean;
  userId: Id<"users"> | null | undefined;
  commentBodies: Record<string, string>;
  activeCommentPostId: string | null;
  onLike: (postId: Id<"social_posts">) => void;
  onSave: (postId: Id<"social_posts">) => void;
  onToggleComment: (postId: Id<"social_posts">) => void;
  onCommentBodyChange: (postId: Id<"social_posts">, body: string) => void;
  onSubmitComment: (postId: Id<"social_posts">) => void;
  emptyTitle?: string;
}) {
  if (posts === undefined) {
    return <p className="text-xl text-white/55">Beiträge werden geladen...</p>;
  }

  if (posts.length === 0 && emptyTitle === "Noch keine Beitraege") {
    posts = [{
      _id: "preview" as Id<"social_posts">,
      body: "Push-Day mit Fokus auf saubere Reps und maximale Kontraktion.\nImmer besser werden.  🧠 💪🏽",
      createdAt: Date.now() - 3 * 60 * 60 * 1000,
      mediaUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1400&q=80",
      mediaType: "image",
      likedByViewer: false,
      savedByViewer: false,
      likeCount: 24,
      commentCount: 6,
      repostCount: 0,
      linkedLog: null,
    }];
  } else if (posts.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center border-y border-white/10 bg-[#050708] px-6 py-8 text-center text-sm text-white/55">
        {emptyTitle}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-y border-white/10">
      {posts.map((post) => {
        const isPreviewPost = post._id === ("preview" as Id<"social_posts">);
        const commentBody = commentBodies[post._id] ?? "";
        const showCommentInput = activeCommentPostId === post._id;
        return (
        <article key={post._id} className="border-b border-white/10 bg-[#050708] px-6 py-4 last:border-b-0 sm:px-8">
          <div className="flex items-start gap-3">
            <Avatar name={profileName} avatarUrl={avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-base font-bold text-white sm:text-lg">
                    {profileName}
                    {isPro && <BadgeCheck className="h-5 w-5 shrink-0 fill-sky-400 text-black" />}
                    <span className="truncate text-sm font-normal text-white/45">@{username}</span>
                    <span className="text-xl font-normal text-white/45">· 3 Std.</span>
                  </p>
                </div>
                <button type="button" aria-label="Post-Optionen" className="shrink-0 rounded-md text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              {post.body && <p className="mt-4 whitespace-pre-wrap text-base leading-6 text-white sm:text-lg">{post.body}</p>}
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
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/58 min-[420px]:grid-cols-4">
                <button type="button" disabled={!userId || isPreviewPost} onClick={() => onLike(post._id)} className={`inline-flex items-center gap-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${post.likedByViewer ? "text-rose-500 hover:text-rose-500" : ""}`}><Heart className={`h-5 w-5 ${post.likedByViewer ? "fill-current" : ""}`} />{post.likeCount}</button>
                <button type="button" disabled={!userId || isPreviewPost} onClick={() => onToggleComment(post._id)} className="inline-flex items-center gap-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"><MessageSquare className="h-5 w-5" />{post.commentCount}</button>
                <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 opacity-60"><Repeat2 className="h-5 w-5" />{post.repostCount}</button>
                <button type="button" disabled={!userId || isPreviewPost} onClick={() => onSave(post._id)} className={`inline-flex items-center justify-end transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${post.savedByViewer ? "text-cyan-300 hover:text-cyan-300" : ""}`} aria-label={post.savedByViewer ? "Gespeicherten Beitrag entfernen" : "Post speichern"}><Bookmark className={`h-5 w-5 ${post.savedByViewer ? "fill-current" : ""}`} /></button>
              </div>
              {!isPreviewPost && showCommentInput && (
                <div className="mt-3 flex gap-2">
                  <input
                    id={`profile-comment-${post._id}`}
                    value={commentBody}
                    onChange={(event) => onCommentBodyChange(post._id, event.target.value)}
                    placeholder="Kommentieren..."
                    maxLength={600}
                    className="min-h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
                  />
                  <Button type="button" size="sm" className="bg-cyan-300 text-black hover:bg-cyan-200" disabled={!userId || !commentBody.trim()} onClick={() => onSubmitComment(post._id)}>
                    Senden
                  </Button>
                </div>
              )}
            </div>
          </div>
        </article>
      );
      })}
      <Link href="/social" className="flex h-16 w-full items-center justify-center gap-2 border-t border-white/10 bg-[#050708] text-base font-medium text-white/65 transition hover:bg-white/[0.04] hover:text-white">
        Mehr entdecken
      </Link>
    </div>
  );
}

function WorkoutSummaryCard({
  trainingGoal,
  favoriteLift,
  trainingSummary,
}: {
  trainingGoal?: string;
  favoriteLift?: string;
  trainingSummary: ProfileTrainingSummary | null | undefined;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="flex items-center gap-2 font-medium"><Target className="h-4 w-4 text-cyan-300" />Workout Historie</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {trainingSummary
            ? `${trainingSummary.completedWorkouts} Workouts, ${trainingSummary.totalSets} Sets und ${Math.round(trainingSummary.totalVolume).toLocaleString("de-DE")} kg Gesamtvolumen.`
            : "Noch keine sichtbare Workout Historie."}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="flex items-center gap-2 font-medium"><Dumbbell className="h-4 w-4 text-cyan-300" />Lieblingslift</p>
        <p className="mt-2 text-2xl font-semibold">{favoriteLift || "Noch offen"}</p>
        {trainingGoal && <p className="mt-2 text-sm leading-6 text-muted-foreground">{trainingGoal}</p>}
      </div>
    </div>
  );
}

function AboutProfileCard({
  profile,
  form,
  primaryLiftLabel,
}: {
  profile: VisibleProfile | null | undefined;
  form: ProfileForm;
  primaryLiftLabel: string;
}) {
  const rows = [
    profile?.location ? ["Ort", profile.location] : null,
    profile?.heightCm ? ["Größe", `${profile.heightCm} cm`] : null,
    profile?.weightKg ? ["Gewicht", `${profile.weightKg} kg`] : null,
    profile?.favoriteLift || primaryLiftLabel ? ["Lieblingslift", profile?.favoriteLift || primaryLiftLabel] : null,
    form.trainingGoal ? ["Ziel", form.trainingGoal] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="font-medium">Über mich</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {profile?.bio || "Noch keine Beschreibung hinterlegt."}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <PreviewRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function TopLogsCard({ logs, embedded = false }: { logs: ProfileTopLog[] | undefined; embedded?: boolean }) {
  const highlight = logs?.[0];

  return (
    <Card className={cn("overflow-hidden border-cyan-500/15 bg-card/95 shadow-xl shadow-cyan-950/5", embedded && "shadow-none")}>
      <CardHeader className="border-b border-border/70 bg-muted/10">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-cyan-300" />
          Top Logs
          </span>
          {logs?.some((log) => log.isTopFivePercent) && (
            <Badge className="gap-1 bg-cyan-300 text-slate-950">
              <Sparkles className="h-3 w-3" />
              Top 5%
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Verified Lifts mit Leaderboard-Gefühl und Platz für künftige Video-Highlights.</p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {logs === undefined ? (
          <p className="text-sm text-muted-foreground">Lade Top Logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine verified Logs. Reiche ein Top-Set ein, um hier aufzutauchen.
          </p>
        ) : (
          <>
          {highlight && (
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/12 via-muted/20 to-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-950/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">Current Highlight</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{highlight.exerciseName || LIFT_LABELS[highlight.submission.liftType]}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {highlight.submission.weightKg} kg x {highlight.submission.reps} · Score {highlight.submission.score ?? "-"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {highlight.rank && <Badge variant="secondary">#{highlight.rank} von {highlight.total}</Badge>}
                  {highlight.percentile && <Badge variant="outline">{highlight.percentile}% Percentile</Badge>}
                  <Badge variant="outline" className="border-cyan-500/30">
                    <ImageIcon className="h-3 w-3" />
                    Video ready
                  </Badge>
                </div>
              </div>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.submission._id} className="rounded-lg border border-border bg-muted/25 p-3 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-muted/40">
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
                {new Date(log.submission.submittedAt).toLocaleDateString("de-DE")}
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
}: {
  templates: ProfileWorkoutTemplate[] | undefined;
  ownerView?: boolean;
  embedded?: boolean;
}) {
  return (
    <Card className={cn("border-blue-500/10 bg-card/95 shadow-xl shadow-blue-950/5", embedded && "shadow-none")}>
      <CardHeader className="border-b border-border/70 bg-muted/10">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-cyan-300" />
          Workout-Playlists
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gespeicherte Workouts wie Playlists, mit eigener Sichtbarkeit.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {templates === undefined ? (
          <p className="text-sm text-muted-foreground">Workout-Playlists werden geladen...</p>
        ) : templates.length === 0 ? (
          <ProfileEmpty
            icon={PlusCircle}
            title="Noch keine Workout-Playlists"
            copy={ownerView ? "Speichere ein abgeschlossenes Workout als Vorlage, um es hier anzuzeigen." : "Keine sichtbaren Workout-Playlists."}
            action={ownerView ? { href: "/workouts", label: "Playlist vorbereiten" } : undefined}
          />
        ) : (
          templates.map((template) => (
            <div key={template._id} className="rounded-xl border border-border bg-muted/25 p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-muted/40 hover:shadow-lg hover:shadow-cyan-950/10">
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
                    {template.visibility === "public"
                      ? "Öffentlich"
                      : template.visibility === "friends"
                        ? "Nur Freunde"
                        : "Privat"}
                  </Badge>
                  <Badge variant="secondary">
                    {template.showWeights ? "Mit Gewichten" : "Ohne Gewichte"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {template.exercises.slice(0, 4).map((exercise) => (
                  <div key={`${template._id}-${exercise.exerciseName}`} className="rounded-lg bg-background p-2 text-sm">
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
          ))
        )}
      </CardContent>
    </Card>
  );
}

type ChatMessageView = {
  body: string;
  postId?: Id<"social_posts">;
  mediaUrl?: string | null;
  postPreview?: {
    _id: Id<"social_posts">;
    author: { name: string; username?: string } | null;
    excerpt: string;
    mediaUrl?: string | null;
    mediaType?: "image" | "video" | "gif" | null;
  } | null;
};

function PostShareCard({ message, mine }: { message: ChatMessageView; mine: boolean }) {
  const postId = message.postId ?? message.postPreview?._id;
  const href = postId ? `/social?post=${postId}` : "/social";
  const authorLabel = message.postPreview?.author
    ? `@${message.postPreview.author.username ?? message.postPreview.author.name}`
    : "Unbekannter Autor";

  return (
    <Link
      href={href}
      className={cn(
        "block overflow-hidden rounded-xl border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mine ? "border-primary-foreground/25 hover:bg-primary-foreground/10" : "border-border hover:bg-muted/40"
      )}
    >
      <div className="flex gap-3 p-3">
        {message.postPreview?.mediaUrl ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {message.postPreview.mediaType === "video" ? (
              <video src={message.postPreview.mediaUrl} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.postPreview.mediaUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Beitrag geteilt</p>
          <p className="mt-1 truncate text-sm font-medium">{authorLabel}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {message.postPreview?.excerpt || "Dieser Beitrag ist nicht mehr verfügbar oder hat keinen Text."}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            Beitrag ansehen
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
        <img src={message.mediaUrl} alt="" className="max-h-72 w-full rounded-xl object-contain" />
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      {message.body && <p className="whitespace-pre-wrap break-words leading-5">{message.body}</p>}
    </div>
  );
}

function MediaUpload({
  label,
  description,
  uploading,
  onFile,
}: {
  label: string;
  description: string;
  uploading: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-sm transition-colors hover:bg-muted">
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        </span>
        <span>
          <span className="block font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">
            {uploading ? "Upload läuft..." : description}
          </span>
        </span>
      </span>
      <span className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium">
        Datei
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
    </label>
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
    <div className="min-h-[5.75rem] border-r border-white/[0.08] px-1.5 py-3 text-center transition-colors last:border-r-0 hover:bg-white/[0.035] sm:min-h-28 sm:px-3 sm:py-4" aria-label={`${label}: ${value}${detail ? `, ${detail}` : ""}`}>
      <Icon aria-hidden="true" className={cn("mx-auto mb-2 h-4 w-4 text-white/85 sm:mb-3 sm:h-5 sm:w-5", iconClassName)} />
      <p className="truncate text-[0.92rem] font-bold leading-tight text-white min-[390px]:text-[1rem] sm:text-xl" title={value}>{value}</p>
      <p className="mt-1.5 text-[0.68rem] leading-tight text-white/58 min-[390px]:text-[0.72rem] sm:mt-2 sm:text-sm">{label}</p>
      {detail && <p className="mt-1 truncate text-[0.66rem] leading-tight text-white/40 min-[390px]:text-[0.7rem] sm:text-sm" title={detail}>{detail}</p>}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "md" | "lg" | "hero" }) {
  const classes =
    size === "hero"
      ? "h-[4.5rem] w-[4.5rem] text-4xl sm:h-28 sm:w-28 sm:text-7xl"
      : size === "lg"
        ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl"
        : "h-11 w-11 text-base";
  return (
    <div className={`${classes} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-cyan-300 bg-[#272a2c] font-semibold text-white shadow-[0_0_32px_rgba(34,211,238,0.22)] sm:border-4`}>
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PublicField({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <PublicFieldLabel label={label} checked={checked} onChange={onChange} />
      {children}
    </div>
  );
}

function PublicFieldLabel({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-6 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <Label>{label}</Label>
      <label className="flex max-w-full shrink-0 items-center gap-2 self-end text-xs leading-none text-white/58 sm:self-auto">
        <span>Im Profil zeigen</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-cyan-300"
        />
      </label>
    </div>
  );
}

function AccentSelect({ value, onChange }: { value: Accent; onChange: (value: Accent) => void }) {
  const selected = ACCENT_OPTIONS.find((option) => option.value === value) ?? ACCENT_OPTIONS[0];
  return (
    <Select value={value} onValueChange={(nextValue) => nextValue && onChange(nextValue as Accent)}>
      <SelectTrigger className="h-11 w-full min-w-0 border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.07]">
        <span className={cn("h-5 w-5 shrink-0 rounded-full bg-gradient-to-br", ACCENTS[value])} />
        <SelectValue placeholder={selected.label} />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#0d1115] text-white">
        {ACCENT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className={cn("h-4 w-4 rounded-full bg-gradient-to-br", ACCENTS[option.value])} />
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProfileVisibilitySelect({
  value,
  onChange,
}: {
  value: "private" | "public";
  onChange: (value: "private" | "public") => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025]">
      <Select value={value} onValueChange={(nextValue) => nextValue && onChange(nextValue as "private" | "public")}>
        <SelectTrigger className="h-auto min-h-16 w-full min-w-0 flex-wrap items-start gap-2 border-0 px-3 py-3 text-white hover:bg-white/[0.04] sm:flex-nowrap sm:items-center sm:px-4">
          <div className="min-w-0 flex-1 basis-full text-left sm:basis-auto">
            <p className="font-semibold">Profil-Privatsphäre</p>
            <p className="mt-1 text-xs leading-5 text-white/48">
              Wenn du zu einem öffentlichen Profil wechselst, können andere Personen freigegebene Infos sehen.
            </p>
          </div>
          <SelectValue className="min-w-0 flex-none text-sm text-white/58" placeholder={value === "public" ? "Öffentlich" : "Privat"} />
          <ChevronRight className="h-4 w-4 shrink-0 text-white/45" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#0d1115] text-white">
          <SelectItem value="private">Privat</SelectItem>
          <SelectItem value="public">Öffentlich</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function PrivacyToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm text-white">
      <span className="min-w-0 leading-5">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-cyan-300" />
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
    <div className="rounded-xl border border-dashed border-cyan-500/20 bg-cyan-500/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
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
          ? "border-cyan-500/30 bg-cyan-500/10 shadow-cyan-950/10"
          : "border-border bg-muted/20 hover:border-cyan-500/25 hover:bg-muted/35"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-medium uppercase leading-none tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-cyan-300" />}
      </div>
      <p className="mt-3 text-xl font-semibold leading-tight tracking-tight">{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

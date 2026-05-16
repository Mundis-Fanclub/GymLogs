"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import {
  Ban,
  Crown,
  Eye,
  Flag,
  ImagePlus,
  Lock,
  MessageCircle,
  MoveRight,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  UserPlus,
  Users,
  X,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ACCENTS = {
  emerald: "from-emerald-500 via-sky-500 to-slate-950",
  sky: "from-sky-500 via-cyan-400 to-slate-950",
  rose: "from-rose-500 via-orange-400 to-slate-950",
  amber: "from-amber-400 via-lime-500 to-slate-950",
  violet: "from-violet-500 via-fuchsia-400 to-slate-950",
} as const;

type Accent = keyof typeof ACCENTS;

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

const LIFT_LABELS = {
  bench_press: "Bench Press",
  squat: "Squat",
  deadlift: "Deadlift",
} as const;

export default function ProfilePage() {
  const { userId, isLoaded } = useConvexUser();
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const publicPreview = useQuery(
    api.users.getPublicProfile,
    userId ? { userId, viewerId: undefined } : "skip"
  );
  const conversations = useQuery(
    api.messages.conversations,
    userId ? { userId } : "skip"
  );
  const topLogs = useQuery(
    api.logs.getProfileTopLogs,
    userId ? { userId, viewerId: undefined, limit: 5 } : "skip"
  );
  const workoutTemplates = useQuery(
    api.workouts.listProfileTemplates,
    userId ? { userId, viewerId: undefined, limit: 12 } : "skip"
  );
  const friends = useQuery(api.friends.list, userId ? { userId } : "skip");
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const addFriend = useMutation(api.friends.addByUsername);
  const removeFriend = useMutation(api.friends.remove);
  const sendMessage = useMutation(api.messages.send);
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
    publicHeight: false,
    publicWeight: false,
    publicBirthDate: false,
    publicTrainingSummary: true,
  });

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

  const unreadTotal = useMemo(
    () => conversations?.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0,
    [conversations]
  );
  const profileUrl = userId ? `/profile/${userId}` : "/profile";
  const accentClass = ACCENTS[form.profileAccent] ?? ACCENTS.emerald;
  const displayAvatarUrl = avatarPreviewUrl || form.avatarUrl;
  const displayCoverUrl = coverPreviewUrl || form.coverUrl;
  const visibleProfile = publicPreview;

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
      setUploadError("Bitte waehle eine Bilddatei aus.");
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
        setAvatarPreviewUrl(previewUrl);
        setForm((current) => ({ ...current, avatarStorageId: storageId }));
      } else {
        setCoverPreviewUrl(previewUrl);
        setForm((current) => ({ ...current, coverStorageId: storageId }));
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(null);
    }
  }

  async function submitMessage(targetId?: Id<"users">) {
    if (!userId || !messageBody.trim()) return;
    const recipientId = targetId ?? thread?.otherUser?._id ?? messageTarget;
    if (!recipientId) return;
    await sendMessage({ senderId: userId, recipientId, body: messageBody });
    setMessageBody("");
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

  return (
    <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div
            className={`relative min-h-44 bg-gradient-to-br ${accentClass}`}
            style={displayCoverUrl ? { backgroundImage: `url(${displayCoverUrl})` } : undefined}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              <Avatar name={form.name} avatarUrl={displayAvatarUrl} size="lg" />
              <div className="min-w-0 flex-1 text-white">
                <h1 className="flex items-center gap-2 truncate text-3xl font-semibold">
                  {form.name || "GymLogs User"}
                  {user?.isPro && <Crown className="h-6 w-6 shrink-0 text-amber-300" />}
                </h1>
                <p className="text-sm text-white/80">@{form.username || "username"}</p>
              </div>
              <div className="hidden flex-wrap gap-2 sm:flex">
                <a href="#messages">
                  <Button variant="secondary" className="gap-1.5">
                    Nachrichten
                    <MoveRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/social">
                  <Button variant="secondary" className="gap-1.5">
                    Social
                    <MoveRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={() => setEditProfileOpen(true)}>
                Profil bearbeiten
              </Button>
              <Link href={profileUrl} className="flex-1">
                <Button variant="outline" className="w-full">
                  Öffentlich ansehen
                </Button>
              </Link>
            </div>
            {(visibleProfile?.bio || visibleProfile?.location || visibleProfile?.favoriteLift || visibleProfile?.trainingGoal) && (
              <div className="space-y-3 text-sm">
                {visibleProfile?.bio && <p className="leading-6">{visibleProfile.bio}</p>}
                <div className="flex flex-wrap gap-2">
                  {visibleProfile?.location && <Badge variant="secondary">{visibleProfile.location}</Badge>}
                  {visibleProfile?.favoriteLift && <Badge variant="secondary">{visibleProfile.favoriteLift}</Badge>}
                </div>
                {visibleProfile?.trainingGoal && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Trainingsziel</p>
                    <p className="mt-1">{visibleProfile.trainingGoal}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {visibleProfile?.heightCm && <QuickStat label="Größe" value={`${visibleProfile.heightCm} cm`} />}
              {visibleProfile?.weightKg && <QuickStat label="Gewicht" value={`${visibleProfile.weightKg} kg`} />}
              {visibleProfile?.birthDate && (
                <QuickStat label="Geburtsdatum" value={new Date(visibleProfile.birthDate).toLocaleDateString("de-DE")} />
              )}
              {visibleProfile?.trainingSummary && (
                <>
                  <QuickStat label="Workouts" value={String(visibleProfile.trainingSummary.completedWorkouts)} />
                  <QuickStat label="Sets" value={String(visibleProfile.trainingSummary.totalSets)} />
                  <QuickStat label="Frequenz" value={`${visibleProfile.trainingSummary.averageWorkoutsPerWeek}/Woche`} />
                </>
              )}
            </div>
            <div className="grid gap-2 sm:hidden">
              <a href="#messages">
                <Button variant="outline" className="w-full gap-1.5">
                  Nachrichten
                  <MoveRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/social">
                <Button variant="outline" className="w-full gap-1.5">
                  Social
                  <MoveRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

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
              <Link href={profileUrl}>
                <Button variant="outline" className="w-full gap-1.5 sm:w-auto">
                  <Eye className="h-4 w-4" />
                  Öffentlich ansehen
                </Button>
              </Link>
              {saved && <span className="self-center text-sm text-emerald-500">Gespeichert</span>}
            </div>
            </div>
          </DialogContent>
        </Dialog>

        <TopLogsCard logs={topLogs} />

        <WorkoutTemplatesCard templates={workoutTemplates} />

        <Card id="messages" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Nachrichten
              {unreadTotal > 0 && <Badge>{unreadTotal} ungelesen</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="space-y-2">
              {conversations === undefined ? (
                <p className="text-sm text-muted-foreground">Nachrichten werden geladen...</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Nachrichten.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setActiveConversation(conversation._id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      activeConversation === conversation._id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:bg-muted"
                    }`}
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

            <div className="min-h-[24rem] rounded-lg border border-border bg-background">
              {!thread ? (
                <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8" />
                  Wähle eine Unterhaltung aus.
                </div>
              ) : (
                <div className="flex min-h-[24rem] flex-col">
                  <div className="flex items-center justify-between gap-3 border-b border-border p-3">
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
                  <div className="flex-1 space-y-3 overflow-auto p-3">
                    {thread.messages.map((message) => {
                      const mine = message.senderId === userId;
                      return (
                        <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[78%] rounded-lg border p-3 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                            <p>{message.body}</p>
                            <div className={`mt-2 flex items-center justify-between gap-3 text-[0.7rem] ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                              <span>{new Date(message.createdAt).toLocaleString("de-DE")}</span>
                              {mine ? <span>{message.readAt ? "Gelesen" : "Ungelesen"}</span> : (
                                <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => setReportedMessage(message._id)}>
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
                  <div className="border-t border-border p-3">
                    <div className="flex gap-2">
                      <Input
                        value={messageBody}
                        disabled={thread.isBlocked}
                        placeholder={thread.isBlocked ? "Du hast diese Person blockiert." : "Nachricht schreiben..."}
                        onChange={(event) => setMessageBody(event.target.value)}
                        maxLength={600}
                      />
                      <Button size="icon" disabled={thread.isBlocked || !messageBody.trim()} onClick={() => submitMessage()}>
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

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Freunde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    <div key={entry.friendshipId} className="flex items-center gap-3 rounded-lg border border-border p-2">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Nutzer finden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Name oder Username" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="space-y-2">
              {searchResults?.map((result) => (
                <div key={result._id} className="rounded-lg border border-border p-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Datenschutzvorschau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`rounded-lg bg-gradient-to-br ${accentClass} p-4 text-white`}>
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

function TopLogsCard({ logs }: { logs: ProfileTopLog[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Logs
          {logs?.some((log) => log.isTopFivePercent) && (
            <Badge className="gap-1">
              <Sparkles className="h-3 w-3" />
              Top 5%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {logs === undefined ? (
          <p className="text-sm text-muted-foreground">Lade Top Logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine verified Logs. Reiche ein Top-Set ein, um hier aufzutauchen.
          </p>
        ) : (
          logs.map((log) => (
            <div key={log.submission._id} className="rounded-lg border border-border bg-muted/30 p-3">
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
          ))
        )}
      </CardContent>
    </Card>
  );
}

function WorkoutTemplatesCard({
  templates,
  ownerView = false,
}: {
  templates: ProfileWorkoutTemplate[] | undefined;
  ownerView?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
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
          <p className="text-sm text-muted-foreground">
            {ownerView
              ? "Speichere ein abgeschlossenes Workout als Vorlage, um es hier anzuzeigen."
              : "Keine sichtbaren Workout-Playlists."}
          </p>
        ) : (
          templates.map((template) => (
            <div key={template._id} className="rounded-lg border border-border bg-muted/30 p-3">
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

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "md" | "lg" }) {
  const classes = size === "lg" ? "h-24 w-24 text-3xl" : "h-11 w-11 text-base";
  return (
    <div className={`${classes} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted font-semibold`}>
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

function PrivacyToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" />
    </label>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

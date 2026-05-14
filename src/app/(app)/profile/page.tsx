"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Search, Send, Lock } from "lucide-react";

export default function ProfilePage() {
  const { userId, isLoaded } = useConvexUser();
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const inbox = useQuery(api.messages.inbox, userId ? { userId } : "skip");
  const updateProfile = useMutation(api.users.updateProfile);
  const sendMessage = useMutation(api.messages.send);
  const [query, setQuery] = useState("");
  const searchResults = useQuery(
    api.users.searchPublic,
    userId && query.trim().length >= 2 ? { query, viewerId: userId } : "skip"
  );

  const [messageTarget, setMessageTarget] = useState<Id<"users"> | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    heightCm: "",
    weightKg: "",
    birthDate: "",
    isPublic: true,
    allowMessages: true,
    publicHeight: false,
    publicWeight: false,
    publicBirthDate: false,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      heightCm: user.heightCm?.toString() ?? "",
      weightKg: user.weightKg?.toString() ?? "",
      birthDate: user.birthDate ?? "",
      isPublic: user.isPublic ?? true,
      allowMessages: user.allowMessages ?? true,
      publicHeight: user.publicFields?.heightCm ?? false,
      publicWeight: user.publicFields?.weightKg ?? false,
      publicBirthDate: user.publicFields?.birthDate ?? false,
    });
  }, [user]);

  if (isLoaded && !userId) {
    return (
      <EmptyState
        icon={User}
        title="Profil nur mit Login"
        description="Melde dich an, um dein Profil zu bearbeiten."
        action={<Link href="/sign-in"><Button>Anmelden</Button></Link>}
      />
    );
  }

  async function saveProfile() {
    if (!userId) return;
    await updateProfile({
      userId,
      name: form.name,
      username: form.username,
      bio: form.bio,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      birthDate: form.birthDate || undefined,
      isPublic: form.isPublic,
      allowMessages: form.allowMessages,
      publicFields: {
        heightCm: form.publicHeight,
        weightKg: form.publicWeight,
        birthDate: form.publicBirthDate,
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  async function submitMessage() {
    if (!userId || !messageTarget || !messageBody.trim()) return;
    await sendMessage({ senderId: userId, recipientId: messageTarget, body: messageBody });
    setMessageBody("");
    setMessageTarget(null);
  }

  const profileUrl = userId ? `/profile/${userId}` : "/profile";

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle>Dein Profil</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entscheide selbst, welche Trainingsdaten öffentlich sichtbar sind.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
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
            <div className="sm:col-span-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={3}
                maxLength={180}
              />
            </div>
            <PrivacyToggle
              label="Öffentliches Profil"
              checked={form.isPublic}
              onChange={(checked) => setForm({ ...form, isPublic: checked })}
            />
            <PrivacyToggle
              label="Nachrichten erlauben"
              checked={form.allowMessages}
              onChange={(checked) => setForm({ ...form, allowMessages: checked })}
            />
            <PrivacyToggle
              label="Größe öffentlich"
              checked={form.publicHeight}
              onChange={(checked) => setForm({ ...form, publicHeight: checked })}
            />
            <PrivacyToggle
              label="Gewicht öffentlich"
              checked={form.publicWeight}
              onChange={(checked) => setForm({ ...form, publicWeight: checked })}
            />
            <PrivacyToggle
              label="Geburtsdatum öffentlich"
              checked={form.publicBirthDate}
              onChange={(checked) => setForm({ ...form, publicBirthDate: checked })}
            />
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
              <Button onClick={saveProfile}>Profil speichern</Button>
              <Link href={profileUrl}>
                <Button variant="outline" className="w-full sm:w-auto">Öffentlich ansehen</Button>
              </Link>
              {saved && <span className="self-center text-sm text-emerald-500">Gespeichert</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nachrichten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inbox === undefined ? (
              <p className="text-sm text-muted-foreground">Lade Nachrichten...</p>
            ) : inbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Nachrichten.</p>
            ) : (
              inbox.map((message) => (
                <div key={message._id} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Link href={`/profile/${message.senderId}`} className="font-medium hover:underline">
                      {message.sender?.name ?? "Unbekannt"}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{message.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Nutzer finden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Name oder Username"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="space-y-2">
              {searchResults?.map((result) => (
                <div key={result._id} className="rounded-lg border border-border p-3">
                  <Link href={`/profile/${result._id}`} className="font-medium hover:underline">
                    {result.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{result.username}</p>
                  {result.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.bio}</p>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
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
                <Label>Nachricht</Label>
                <Textarea
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  rows={3}
                  maxLength={600}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={submitMessage}>Senden</Button>
                  <Button size="sm" variant="outline" onClick={() => setMessageTarget(null)}>Abbrechen</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
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

function PrivacyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-primary"
      />
    </label>
  );
}

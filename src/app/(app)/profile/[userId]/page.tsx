"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Lock, MessageCircle, Ruler, Scale, User } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const viewedUserId = params.userId as Id<"users">;
  const { userId } = useConvexUser();
  const profile = useQuery(api.users.getPublicProfile, {
    userId: viewedUserId,
    viewerId: userId,
  });
  const sendMessage = useMutation(api.messages.send);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!userId || !body.trim()) return;
    await sendMessage({ senderId: userId, recipientId: viewedUserId, body });
    setBody("");
    setSent(true);
    window.setTimeout(() => setSent(false), 2200);
  }

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">Profil wird geladen...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Profil nicht gefunden.</p>;
  }

  const isSelf = userId === viewedUserId;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="h-28 bg-[linear-gradient(135deg,#0ea5e9,#22c55e)]" />
        <CardContent className="-mt-10 space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-background text-2xl font-semibold">
                {(profile.name ?? "U").slice(0, 1)}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{profile.name}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username ?? "user"}</p>
              </div>
            </div>
            {isSelf && (
              <Link href="/profile">
                <Button variant="outline">Profil bearbeiten</Button>
              </Link>
            )}
          </div>

          {profile.isPublic === false ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Lock className="mb-2 h-4 w-4" />
              Dieses Profil ist privat.
            </div>
          ) : (
            <>
              {profile.bio && <p className="text-sm leading-6">{profile.bio}</p>}
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric icon={Ruler} label="Größe" value={profile.heightCm ? `${profile.heightCm} cm` : "Privat"} />
                <Metric icon={Scale} label="Gewicht" value={profile.weightKg ? `${profile.weightKg} kg` : "Privat"} />
                <Metric icon={Calendar} label="Geburtsdatum" value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("de-DE") : "Privat"} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isSelf && profile.allowMessages && userId && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              Nachricht senden
            </div>
            <div className="space-y-1.5">
              <Label>Nachricht</Label>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={600} />
            </div>
            <Button onClick={submit} disabled={!body.trim()}>Senden</Button>
            {sent && <span className="ml-3 text-sm text-emerald-500">Gesendet</span>}
          </CardContent>
        </Card>
      )}

      {!userId && !isSelf && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            Melde dich an, um Nachrichten zu schreiben.
          </CardContent>
        </Card>
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

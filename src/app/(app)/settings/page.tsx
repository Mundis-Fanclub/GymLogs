import Link from "next/link";
import type { ComponentType } from "react";
import { Bell, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <SettingsPanel
            icon={UserRound}
            title="Profil"
            copy="Name, Avatar, Bio, Sichtbarkeit und Nachrichtenfreigabe verwaltest du im Profil."
            href="/profile"
            action="Profil bearbeiten"
          />
          <SettingsPanel
            icon={Bell}
            title="Nachrichten"
            copy="Deine Unterhaltungen und ungelesenen Nachrichten findest du im Nachrichtenbereich."
            href="/profile#messages"
            action="Nachrichten oeffnen"
          />
          <SettingsPanel
            icon={Shield}
            title="Privatsphaere"
            copy="Blockierte Nutzer und Meldefunktionen bleiben direkt in der Unterhaltung verfuegbar."
            href="/profile#messages"
            action="Unterhaltungen ansehen"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  copy,
  href,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex min-h-52 flex-col rounded-lg border border-border bg-muted/25 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{copy}</p>
      <Link href={href}>
        <Button variant="outline" className="mt-4 w-full">
          {action}
        </Button>
      </Link>
    </div>
  );
}

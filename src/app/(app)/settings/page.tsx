"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { Bell, Check, Languages, Palette, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALES,
  useAppPreferences,
} from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { locale, setLocale, t } = useAppPreferences();

  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <PreferencePanel
              icon={Languages}
              title={t("settings.languageTitle")}
              copy={t("settings.languageCopy")}
            >
              <div className="grid gap-2">
                {LOCALES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLocale(item)}
                    className={cn(
                      "flex min-h-11 items-center justify-between rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      locale === item
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{LOCALE_FLAGS[item]}</span>
                      {LOCALE_LABELS[item]}
                    </span>
                    {locale === item && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </PreferencePanel>

            <PreferencePanel
              icon={Palette}
              title={t("settings.appearanceTitle")}
              copy="Waehle die Akzentfarbe ueber den schwebenden Theme-Button. Layout, Abstaende und Komponenten bleiben unveraendert."
            >
              <div className="rounded-2xl border border-brand/25 bg-brand/10 p-3 text-sm">
                <p className="font-medium text-brand">Accent Theme</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Der runde Palette-Button unten rechts oeffnet das Theme-Popup.
                </p>
              </div>
            </PreferencePanel>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SettingsPanel
              icon={UserRound}
              title={t("settings.profileTitle")}
              copy={t("settings.profileCopy")}
              href="/profile"
              action={t("settings.profileAction")}
            />
            <SettingsPanel
              icon={Bell}
              title={t("settings.messagesTitle")}
              copy={t("settings.messagesCopy")}
              href="/profile#messages"
              action={t("settings.messagesAction")}
            />
            <SettingsPanel
              icon={Shield}
              title={t("settings.privacyTitle")}
              copy={t("settings.privacyCopy")}
              href="/profile#messages"
              action={t("settings.privacyAction")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencePanel({
  icon: Icon,
  title,
  copy,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-panel flex min-h-56 flex-col rounded-3xl p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
      <div className="mt-4 grid gap-2">{children}</div>
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
    <div className="premium-panel flex min-h-40 flex-col rounded-3xl p-4">
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

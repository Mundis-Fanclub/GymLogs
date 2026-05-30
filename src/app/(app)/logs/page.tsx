"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { FEATURED_LOGS, MVP_EXERCISES } from "@/lib/product";
import {
  Check,
  ChevronRight,
  PlayCircle,
  ShieldCheck,
  Trophy,
  Video,
} from "lucide-react";

export default function LogsPage() {
  const { t } = useAppPreferences();
  const pricingPlans = [
    {
      name: "Free",
      price: "0 EUR",
      description: t("logsPage.freeDescription"),
      bullets: [
        t("logsPage.freeBullet1"),
        t("logsPage.freeBullet2"),
        t("logsPage.freeBullet3"),
      ],
    },
    {
      name: "Pro",
      price: t("common.proPrice").replace("Pro ", ""),
      description: t("logsPage.proDescription"),
      bullets: [
        t("logsPage.proBullet1"),
        t("logsPage.proBullet2"),
        t("logsPage.proBullet3"),
      ],
    },
  ];
  const productPillars = [
    {
      title: t("logsPage.trackFast"),
      description: t("logsPage.trackFastCopy"),
      icon: PlayCircle,
      color: "text-info",
    },
    {
      title: t("logsPage.rankFairly"),
      description: t("logsPage.rankFairlyCopy"),
      icon: Trophy,
      color: "text-warning",
    },
    {
      title: t("logsPage.verifyLater"),
      description: t("logsPage.verifyLaterCopy"),
      icon: ShieldCheck,
      color: "text-success",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#121826_0%,#20283b_52%,#4a3327_100%)] text-white ring-0">
          <CardContent className="relative px-4 py-5 sm:px-6 sm:py-7">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)] lg:block" />
            <Badge className="max-w-full truncate border-white/15 bg-white/10 text-white hover:bg-white/10">
              {t("logsPage.eyebrow")}
            </Badge>
            <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
              {t("logsPage.headline")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              {t("logsPage.copy")}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <Button className="h-10 gap-2 bg-white text-slate-950 hover:bg-white/90">
                <Trophy className="w-4 h-4" />
                {t("logsPage.topBench")}
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Video className="w-4 h-4" />
                {t("logsPage.submitSet")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>{t("logsPage.pricingTitle")}</CardTitle>
            <CardDescription>
              {t("logsPage.pricingCopy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="rounded-lg border border-border bg-muted p-4 text-foreground">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge
                    variant={plan.name === "Pro" ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {plan.price}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {plan.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>{t("logsPage.leaderboardTitle")}</CardTitle>
            <CardDescription>
              {t("logsPage.leaderboardCopy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 sm:px-6">
            {FEATURED_LOGS.map((entry) => (
              <div
                key={`${entry.athlete}-${entry.rank}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-3 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                    #{entry.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">{entry.athlete}</p>
                      <Badge variant={entry.status === "verified" ? "default" : "secondary"}>
                        {entry.status === "verified"
                          ? t("common.verified")
                          : t("common.pendingReview")}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {entry.exercise} / {entry.lift} / {entry.bodyweightClass}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-semibold">{entry.score}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("common.logScore")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>{t("logsPage.exercisePoolTitle")}</CardTitle>
              <CardDescription>
                {t("logsPage.exercisePoolCopy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 px-4 sm:px-6">
              {MVP_EXERCISES.map((exercise) => (
                <Badge key={exercise} variant="secondary" className="rounded-full px-3 py-1">
                  {exercise}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>{t("logsPage.pillarsTitle")}</CardTitle>
              <CardDescription>
                {t("logsPage.pillarsCopy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              {productPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                <div key={pillar.title} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${pillar.color}`} />
                    <p className="font-medium">{pillar.title}</p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-sky-300 bg-sky-900 text-white dark:bg-sky-950">
            <CardContent className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="font-medium">{t("logsPage.nextTitle")}</p>
                <p className="text-sm text-sky-100">
                  {t("logsPage.nextCopy")}
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 gap-1.5 !border-white !bg-white !text-sky-950 hover:!bg-sky-100"
              >
                {t("logsPage.defineSchema")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

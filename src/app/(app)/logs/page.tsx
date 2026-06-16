"use client";

import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppEmptyPanel, AppPage } from "@/components/ui/app-surface";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { MVP_EXERCISES } from "@/lib/product";
import { api } from "../../../../convex/_generated/api";
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
  const leaderboard = useQuery(api.logs.leaderboard, {
    liftType: "bench_press",
    limit: 10,
  });
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
    <AppPage className="max-w-6xl md:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden border-primary/25 bg-[radial-gradient(circle_at_85%_0%,var(--brand-soft),transparent_34%)]">
          <CardContent className="relative px-4 py-5 sm:px-6 sm:py-7">
            <Badge className="max-w-full truncate border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
              {t("logsPage.eyebrow")}
            </Badge>
            <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
              {t("logsPage.headline")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("logsPage.copy")}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <Button className="h-10 gap-2">
                <Trophy className="w-4 h-4" />
                {t("logsPage.topBench")}
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2"
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
              <div key={plan.name} className="rounded-2xl border border-border bg-muted/35 p-4 text-foreground">
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
            {leaderboard === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-2xl border border-border/70 bg-muted/30"
                  />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <AppEmptyPanel
                icon={Trophy}
                title={t("profile.topLogs.empty")}
                description={t("profile.topLogs.copy")}
                className="py-8"
              />
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.submission._id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3 py-3 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold">
                      #{entry.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-medium">{entry.athleteName}</p>
                        <Badge variant="default">{t("common.verified")}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {entry.exerciseName} / {entry.submission.weightKg} kg x{" "}
                        {entry.submission.reps} / {entry.submission.bodyweightClass}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-semibold">
                      {entry.submission.score ?? "-"}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("common.logScore")}
                    </p>
                  </div>
                </div>
              ))
            )}
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
                <div key={pillar.title} className="rounded-2xl border border-border/70 p-4">
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

          <Card className="border-info/30 bg-info/10">
            <CardContent className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="font-medium">{t("logsPage.nextTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("logsPage.nextCopy")}
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 gap-1.5"
              >
                {t("logsPage.defineSchema")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppPage>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import Link from "next/link";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, Dumbbell, Trophy } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export default function WorkoutsPage() {
  const { userId } = useConvexUser();
  const { locale, t } = useAppPreferences();
  const workouts = useQuery(
    api.workouts.list,
    userId ? { userId, limit: 50 } : "skip"
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{t("workouts.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("workouts.copy")}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("workouts.logWorthyTitle")}</CardTitle>
            <CardDescription>
              {t("workouts.logWorthyCopy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/logs">
              <Button variant="outline" className="gap-2">
                <Trophy className="h-4 w-4" />
                {t("common.viewLogs")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {workouts === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{t("workouts.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <Link key={workout._id} href={`/workouts/${workout._id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium text-sm">
                      {format(workout.date, "EEEE, MMMM d, yyyy", {
                        locale: locale === "de" ? de : enUS,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(workout.date, "h:mm a")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

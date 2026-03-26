"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVolume } from "@/lib/pr-utils";
import { ChevronRight, Dumbbell } from "lucide-react";

export default function WorkoutsPage() {
  const { userId } = useConvexUser();
  const workouts = useQuery(
    api.workouts.list,
    userId ? { userId, limit: 50 } : "skip"
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Workouts</h1>

      {workouts === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No workouts yet. Start your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <Link key={workout._id} href={`/workouts/${workout._id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium text-sm">
                      {format(workout.date, "EEEE, MMMM d, yyyy")}
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

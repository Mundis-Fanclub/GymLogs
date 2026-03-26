"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/constants";
import { Search } from "lucide-react";

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const { userId } = useConvexUser();

  const exercises = useQuery(api.exercises.search, { query, limit: 100 });

  // Group by muscle group
  const grouped = exercises?.reduce(
    (acc, ex) => {
      const group = ex.muscleGroup as MuscleGroup;
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
    },
    {} as Record<MuscleGroup, typeof exercises>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Exercises</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {exercises === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {MUSCLE_GROUPS.filter((mg) => grouped[mg]?.length).map((mg) => (
            <div key={mg}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {MUSCLE_GROUP_LABELS[mg]}
              </h2>
              <div className="space-y-0.5">
                {grouped[mg]?.map((ex) => (
                  <Link
                    key={ex._id}
                    href={`/exercises/${ex._id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors text-sm"
                  >
                    <span>{ex.name}</span>
                    <div className="flex items-center gap-2">
                      {ex.isCustom && (
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {ex.category}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";

export function TopBar() {
  const router = useRouter();
  const { userId } = useConvexUser();
  const createWorkout = useMutation(api.workouts.create);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  async function handleNewWorkout() {
    if (!userId) return;
    if (incompleteWorkout) {
      router.push(`/workouts/new`);
      return;
    }
    await createWorkout({ userId });
    router.push("/workouts/new");
  }

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleNewWorkout} className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Workout
        </Button>
        <UserButton />
      </div>
    </header>
  );
}

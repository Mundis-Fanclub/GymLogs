"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useConvexUser() {
  const { user, isLoaded } = useUser();
  const getOrCreate = useMutation(api.users.getOrCreate);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    getOrCreate({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Unknown",
      email: user.primaryEmailAddress?.emailAddress ?? "",
    });
  }, [isLoaded, user, getOrCreate]);

  return {
    userId: convexUser?._id as Id<"users"> | undefined,
    convexUser,
    isLoaded: isLoaded && convexUser !== undefined,
  };
}

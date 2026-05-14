"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const getOrCreate = useMutation(api.users.getOrCreate);
  const creatingForClerkId = useRef<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    clerkId: string;
    userId: Id<"users">;
  } | null>(null);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) {
      creatingForClerkId.current = null;
      setCreatedUser(null);
      return;
    }

    if (convexUser === undefined) return;
    if (convexUser) {
      creatingForClerkId.current = null;
      setCreatedUser(null);
      return;
    }

    if (createdUser?.clerkId === user.id) return;
    if (creatingForClerkId.current === user.id) return;
    creatingForClerkId.current = user.id;

    void getOrCreate({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Unknown",
      email: user.primaryEmailAddress?.emailAddress ?? "",
    })
      .then((userId) => {
        setCreatedUser({ clerkId: user.id, userId });
      })
      .finally(() => {
        creatingForClerkId.current = null;
      });
  }, [convexUser, createdUser, isLoaded, user, getOrCreate]);

  const createdUserId =
    createdUser && createdUser.clerkId === user?.id
      ? createdUser.userId
      : undefined;
  const userId = convexUser?._id ?? createdUserId;

  return {
    userId,
    convexUser,
    isSignedIn: Boolean(isSignedIn),
    isLoaded: isLoaded && (!user || userId !== undefined),
  };
}

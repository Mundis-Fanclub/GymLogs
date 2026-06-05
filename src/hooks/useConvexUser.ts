"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const DEV_CLERK_ID = "dev-local-user";
const DEV_AUTH_STORAGE_KEY = "gymlogs-dev-auth";

function isDevAuthEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === "1";
}

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const getOrCreate = useMutation(api.users.getOrCreate);
  const creatingForClerkId = useRef<string | null>(null);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    clerkId: string;
    userId: Id<"users">;
  } | null>(null);
  const effectiveClerkId = user?.id ?? (devAuthEnabled ? DEV_CLERK_ID : undefined);
  const effectiveName = user
    ? user.fullName ?? user.username ?? "Unknown"
    : "GymLogs Dev";
  const effectiveEmail = user?.primaryEmailAddress?.emailAddress ?? "dev@gymlogs.local";
  const authSourceReady = isLoaded || devAuthEnabled;

  const convexUser = useQuery(
    api.users.getByClerkId,
    effectiveClerkId ? { clerkId: effectiveClerkId } : "skip"
  );

  useEffect(() => {
    setDevAuthEnabled(isDevAuthEnabled());

    function handleDevAuthChanged() {
      setDevAuthEnabled(isDevAuthEnabled());
    }

    window.addEventListener("storage", handleDevAuthChanged);
    window.addEventListener("gymlogs-dev-auth-changed", handleDevAuthChanged);
    return () => {
      window.removeEventListener("storage", handleDevAuthChanged);
      window.removeEventListener("gymlogs-dev-auth-changed", handleDevAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!authSourceReady || !effectiveClerkId) {
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

    if (createdUser?.clerkId === effectiveClerkId) return;
    if (creatingForClerkId.current === effectiveClerkId) return;
    creatingForClerkId.current = effectiveClerkId;

    void getOrCreate({
      clerkId: effectiveClerkId,
      name: effectiveName,
      email: effectiveEmail,
    })
      .then((userId) => {
        setCreatedUser({ clerkId: effectiveClerkId, userId });
      })
      .finally(() => {
        creatingForClerkId.current = null;
      });
  }, [authSourceReady, convexUser, createdUser, effectiveClerkId, effectiveEmail, effectiveName, getOrCreate]);

  const createdUserId =
    createdUser && createdUser.clerkId === effectiveClerkId
      ? createdUser.userId
      : undefined;
  const userId = convexUser?._id ?? createdUserId;

  return {
    userId,
    convexUser,
    isSignedIn: Boolean(isSignedIn || devAuthEnabled),
    isLoaded: authSourceReady && (!effectiveClerkId || userId !== undefined),
    isDevAuth: devAuthEnabled && !user,
  };
}

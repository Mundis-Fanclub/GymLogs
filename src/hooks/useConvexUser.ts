"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const getOrCreateMe = useMutation(api.users.getOrCreateMe);
  const getOrCreateLegacyUser = useMutation(api.users.getOrCreate);
  const creatingMe = useRef(false);
  const creatingLegacyUser = useRef(false);
  const [createdUserId, setCreatedUserId] = useState<Id<"users"> | null>(null);
  const [convexAuthFailed, setConvexAuthFailed] = useState(false);
  const localMockAuth = process.env.NEXT_PUBLIC_LOCAL_MOCK_AUTH === "true";

  const convexUser = useQuery(
    api.users.me,
    isAuthenticated && !localMockAuth ? {} : "skip"
  );
  const useLegacyUser =
    localMockAuth &&
    Boolean(user);
  const legacyUser = useQuery(
    api.users.getByClerkId,
    useLegacyUser && user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user || !isAuthenticated) {
      creatingMe.current = false;
      if (!localMockAuth) setCreatedUserId(null);
      setConvexAuthFailed(false);
      return;
    }

    if (convexUser === undefined) return;
    if (convexUser?.tokenIdentifier) {
      creatingMe.current = false;
      setConvexAuthFailed(false);
      return;
    }

    if (creatingMe.current) return;
    creatingMe.current = true;

    void getOrCreateMe({})
      .then((userId) => {
        setCreatedUserId(userId);
      })
      .catch(() => {
        if (localMockAuth) setConvexAuthFailed(true);
      })
      .finally(() => {
        creatingMe.current = false;
      });
  }, [convexUser, getOrCreateMe, isAuthenticated, isLoaded, localMockAuth, user]);

  useEffect(() => {
    if (!useLegacyUser || !user) {
      creatingLegacyUser.current = false;
      return;
    }
    if (legacyUser === undefined) return;
    if (legacyUser || createdUserId || creatingLegacyUser.current) return;

    creatingLegacyUser.current = true;
    void getOrCreateLegacyUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "GymLogs User",
      email: user.primaryEmailAddress?.emailAddress ?? "",
    })
      .then((userId) => {
        setCreatedUserId(userId);
      })
      .finally(() => {
        creatingLegacyUser.current = false;
      });
  }, [
    createdUserId,
    getOrCreateLegacyUser,
    legacyUser,
    useLegacyUser,
    user,
  ]);

  const userId = convexUser?._id ?? legacyUser?._id ?? createdUserId ?? undefined;
  const authSettled = isLoaded && !isLoading;
  const loadedWithoutUser = authSettled && !isSignedIn;
  const legacyNeedsCreate = useLegacyUser && legacyUser === null && !createdUserId;
  const legacyLoading =
    useLegacyUser &&
    !createdUserId &&
    (legacyUser === undefined || legacyNeedsCreate);

  return {
    userId,
    convexUser,
    isSignedIn: Boolean(isSignedIn),
    isLoaded:
      authSettled &&
      !legacyLoading &&
      (Boolean(userId) ||
        loadedWithoutUser ||
        convexAuthFailed ||
        (localMockAuth && !isSignedIn)),
  };
}

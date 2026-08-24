"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  "https://pleasant-hawk-000.convex.cloud";
const convex = new ConvexReactClient(convexUrl);
const localMockAuth = process.env.NEXT_PUBLIC_LOCAL_MOCK_AUTH === "true";

function useLocalMockConvexAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    fetchAccessToken: async () => null,
  };
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (localMockAuth) {
    return (
      <ConvexProviderWithAuth client={convex} useAuth={useLocalMockConvexAuth}>
        {children}
      </ConvexProviderWithAuth>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

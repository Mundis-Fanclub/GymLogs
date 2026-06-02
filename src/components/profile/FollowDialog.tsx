"use client";

import { useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";

type FollowUser = {
  _id: Id<"users">;
  name: string;
  username?: string;
  avatarUrl?: string | null;
  isPro?: boolean;
  viewerFollowing?: boolean;
};

type FollowEntry = {
  followId: Id<"follows">;
  createdAt: number;
  user: FollowUser | null;
};

export type FollowGraph = {
  followerCount: number;
  followingCount: number;
  viewerFollowing: boolean;
  followers: FollowEntry[];
  following: FollowEntry[];
};

export function FollowDialog({
  open,
  onOpenChange,
  graph,
  viewerId,
  profileUserId,
  defaultTab = "followers",
  onFollowToggle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graph: FollowGraph | undefined;
  viewerId?: Id<"users"> | null;
  profileUserId: Id<"users">;
  defaultTab?: "followers" | "following";
  onFollowToggle?: (targetId: Id<"users">, following: boolean) => void;
}) {
  const { t } = useAppPreferences();
  const [tab, setTab] = useState<"followers" | "following">(defaultTab);
  const rows = tab === "followers" ? graph?.followers : graph?.following;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("profile.follow.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 border-b border-border">
          {(["followers", "following"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "min-h-14 border-b-2 border-transparent px-3 text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground",
                tab === item && "border-primary text-foreground"
              )}
            >
              <span className="block">{t(`profile.follow.${item}`)}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {item === "followers" ? graph?.followerCount ?? 0 : graph?.followingCount ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {!rows ? (
            <p className="p-5 text-sm text-muted-foreground">{t("profile.follow.loading")}</p>
          ) : rows.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">{t("profile.follow.empty")}</p>
          ) : (
            rows.map((entry) => {
              if (!entry.user) return null;
              const canToggle = Boolean(
                viewerId &&
                  viewerId !== entry.user._id &&
                  profileUserId !== entry.user._id &&
                  onFollowToggle
              );
              return (
                <div key={entry.followId} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {entry.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold">
                      {entry.user.name}
                      {entry.user.isPro && <BadgeCheck className="h-4 w-4 shrink-0 fill-sky-400 text-background" />}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      @{entry.user.username ?? "user"}
                    </p>
                  </div>
                  {canToggle && (
                    <Button
                      type="button"
                      size="sm"
                      variant={entry.user.viewerFollowing ? "secondary" : "default"}
                      className="min-w-24 rounded-full"
                      onClick={() => onFollowToggle?.(entry.user!._id, Boolean(entry.user?.viewerFollowing))}
                    >
                      {entry.user.viewerFollowing ? t("profile.follow.following") : t("profile.follow.follow")}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

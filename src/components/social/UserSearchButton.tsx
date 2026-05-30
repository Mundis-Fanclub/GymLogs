"use client";

import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { BadgeCheck, Search, UserPlus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserSearchButtonProps = {
  className?: string;
  compact?: boolean;
  label?: string;
  triggerClassName?: string;
  icon?: ComponentType<{ className?: string }>;
};

export function UserSearchButton({
  className,
  compact = false,
  label,
  triggerClassName,
  icon: Icon = Search,
}: UserSearchButtonProps) {
  const { userId } = useConvexUser();
  const { t } = useAppPreferences();
  const resolvedLabel = label ?? t("userSearch.trigger");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const suggestedUsers = useQuery(
    api.users.suggestPublic,
    open ? (userId ? { viewerId: userId, limit: 8 } : { limit: 8 }) : "skip"
  );
  const searchResults = useQuery(
    api.users.searchPublic,
    open && trimmedQuery.length >= 2
      ? userId
        ? { query: trimmedQuery, viewerId: userId }
        : { query: trimmedQuery }
      : "skip"
  );
  const users = useMemo(
    () => (trimmedQuery.length >= 2 ? searchResults : suggestedUsers) ?? [],
    [searchResults, suggestedUsers, trimmedQuery.length]
  );
  const loading = open && (trimmedQuery.length >= 2 ? searchResults === undefined : suggestedUsers === undefined);

  return (
    <>
      <Button
        type="button"
        size={compact ? "icon-sm" : "sm"}
        variant="outline"
        className={cn("gap-2", className, triggerClassName)}
        aria-label={resolvedLabel}
        title={resolvedLabel}
        onClick={() => setOpen(true)}
      >
        <Icon className="h-4 w-4" />
        {!compact && <span>{resolvedLabel}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-4 pb-3 pt-4">
            <DialogTitle>{t("userSearch.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("userSearch.placeholder")}
                className="h-10 pl-9"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {trimmedQuery.length >= 2 ? t("userSearch.results") : t("userSearch.suggestions")}
            </p>
            <div className="max-h-[56dvh] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {t("userSearch.loading")}
                </p>
              ) : users.length === 0 ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {t("userSearch.empty")}
                </p>
              ) : (
                users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:bg-muted/50"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-semibold">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{(user.name || "U").slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-center gap-1.5 font-medium">
                        <span className="truncate">{user.name || "GymLogs User"}</span>
                        {user.isPro && <BadgeCheck className="h-4 w-4 shrink-0 fill-sky-400 text-background" />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">@{user.username ?? "user"}</p>
                    </div>
                    <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

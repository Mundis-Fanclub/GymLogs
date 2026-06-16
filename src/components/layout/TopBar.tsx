"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Bell, Crown, LogOut, MessageCircle, Settings, User } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { useConvexUser } from "@/hooks/useConvexUser";
import { cn } from "@/lib/utils";

const UserSearchButton = dynamic(
  () => import("@/components/social/UserSearchButton").then((module) => module.UserSearchButton),
  { ssr: false }
);

const HIDDEN_TOP_NAV_PATHS = [
  "/workouts/new",
];

function shouldHideTopNav(pathname: string) {
  if (HIDDEN_TOP_NAV_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return true;
  }

  const workoutDetail = /^\/workouts\/[^/]+$/.test(pathname);
  const exerciseDetail = /^\/exercises\/[^/]+$/.test(pathname);
  return workoutDetail || exerciseDetail;
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useAppPreferences();
  const { userId } = useConvexUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loadChromeData, setLoadChromeData] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useQuery(api.users.get, userId && loadChromeData ? { userId } : "skip");
  const conversations = useQuery(
    api.messages.conversations,
    userId && loadChromeData ? { userId } : "skip"
  );
  const unreadCount = useMemo(
    () => conversations?.reduce((sum, conversation) => sum + conversation.unreadCount, 0) ?? 0,
    [conversations]
  );
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const avatarUrl = currentUser?.avatarUrl ?? user?.imageUrl;
  const displayName = currentUser?.name ?? user?.fullName ?? user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "User";
  const initial = displayName.trim().slice(0, 1).toUpperCase() || "U";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoadChromeData(true), 160);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
    }, 0);

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  if (shouldHideTopNav(pathname)) {
    return null;
  }

  function openMessages() {
    setProfileMenuOpen(false);
    if (pathname === "/profile") {
      if (window.location.hash !== "#messages") {
        window.history.pushState(null, "", "/profile#messages");
      }
      window.dispatchEvent(new Event("gymlogs:open-messages"));
      return;
    }
    router.push("/profile#messages");
  }

  function goToProfileMenuItem(href: string) {
    setProfileMenuOpen(false);
    router.push(href);
  }

  function handleProfileMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='menuitem']"));
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + items.length) % items.length;
      items[nextIndex]?.focus();
    }
    if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      items.at(-1)?.focus();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-3 py-3 shadow-sm shadow-background/30 backdrop-blur-2xl sm:px-5 md:px-6 lg:px-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
        <Link
          href="/dashboard"
          className="flex size-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[1rem] text-[0.64rem] font-extrabold leading-none text-foreground transition hover:bg-muted/35 sm:size-14 sm:rounded-[1.2rem] sm:text-xs"
          aria-label={t("common.appName")}
        >
          <Logo size={32} priority />
          <span className="hidden sm:block">Logged</span>
        </Link>

        <UserSearchButton
          label="Suche Workouts, Nutzer, Posts..."
          triggerClassName={cn(
            "h-11 min-w-0 justify-start rounded-[1.25rem] border-border/70 bg-card/70 px-3 text-left text-sm font-medium text-muted-foreground shadow-inner shadow-background/30 transition hover:bg-card hover:text-foreground",
            "sm:h-14 sm:rounded-[1.45rem] sm:px-5 sm:text-base",
            "[&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6 [&_span]:min-w-0 [&_span]:truncate"
          )}
        />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={t("common.proPrice")}
            title={t("common.proPrice")}
            className="size-11 rounded-[1rem] border-primary/50 bg-primary/10 text-primary transition hover:bg-primary/20 sm:size-14 sm:rounded-[1.2rem]"
          >
            <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          <button
            type="button"
            aria-label={unreadCount > 0 ? `${unreadLabel} ungelesene Benachrichtigungen` : "Benachrichtigungen"}
            title="Benachrichtigungen"
            className="relative inline-flex size-11 items-center justify-center rounded-[1rem] border border-border/80 bg-card/70 text-foreground shadow-inner shadow-background/30 transition hover:bg-card sm:size-14 sm:rounded-[1.2rem]"
            onClick={openMessages}
          >
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full border-2 border-background bg-destructive px-1 text-center text-[0.62rem] font-bold leading-4 text-destructive-foreground sm:-right-1 sm:-top-1 sm:leading-5">
                {unreadLabel}
              </span>
            )}
          </button>

          <div className="relative" ref={profileMenuRef}>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={t("topbar.profileMenu")}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              title={t("topbar.profileMenu")}
              className="relative size-11 overflow-hidden rounded-full border-primary/80 bg-card/70 p-0 text-base font-extrabold text-foreground ring-1 ring-primary/35 transition hover:bg-card sm:size-14 sm:text-lg"
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={t("topbar.profile")} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </Button>
            {profileMenuOpen && (
              <div
                ref={menuRef}
                role="menu"
                aria-label={t("topbar.profileMenu")}
                onKeyDown={handleProfileMenuKeyDown}
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-56 rounded-2xl border border-border bg-popover/95 p-2 text-popover-foreground shadow-2xl shadow-background/35 backdrop-blur-xl"
              >
                <ProfileMenuItem icon={User} label={t("topbar.profile")} onClick={() => goToProfileMenuItem("/profile")} />
                <ProfileMenuItem
                  icon={MessageCircle}
                  label={t("topbar.messages")}
                  badge={unreadCount > 0 ? unreadLabel : undefined}
                  onClick={openMessages}
                />
                <ProfileMenuItem icon={Settings} label={t("topbar.settings")} onClick={() => goToProfileMenuItem("/settings")} />
                <ProfileMenuItem
                  icon={LogOut}
                  label={t("topbar.signOut")}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void signOut({ redirectUrl: "/sign-in" });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold leading-5 text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

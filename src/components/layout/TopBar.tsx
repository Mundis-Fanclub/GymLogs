"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crown, LogOut, MessageCircle, Plus, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { UserSearchButton } from "@/components/social/UserSearchButton";
import { useConvexUser } from "@/hooks/useConvexUser";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useConvexUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const profileImageUrl = user?.imageUrl;
  const { t } = useAppPreferences();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const conversations = useQuery(api.messages.conversations, userId ? { userId } : "skip");
  const unreadCount = useMemo(
    () => conversations?.reduce((sum, conversation) => sum + conversation.unreadCount, 0) ?? 0,
    [conversations]
  );
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const showUserSearch =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/social" ||
    pathname.startsWith("/social/");

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

  if (pathname.startsWith("/profile")) {
    return null;
  }

  function handleNewWorkout() {
    if (!userId) return;
    router.push("/workouts/new");
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
    <header className="sticky top-0 z-30 relative grid h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:h-14 sm:px-5 md:px-6">
      <Link
        href="/dashboard"
        className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden"
        aria-label={t("common.appName")}
      >
        <Logo size={44} priority />
      </Link>
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="hidden md:block">
          <p className="truncate text-sm font-medium">{t("topbar.title")}</p>
          <p className="text-xs text-muted-foreground">{t("topbar.subtitle")}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {showUserSearch && (
          <UserSearchButton compact triggerClassName="order-0" />
        )}
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={t("common.proPrice")}
          title={t("common.proPrice")}
          className="gap-1.5 !border-amber-300 !bg-amber-300 !text-slate-950 hover:!bg-amber-200 sm:w-auto sm:px-3 lg:inline-flex"
        >
          <Crown className="h-4 w-4" />
          <span className="hidden sm:inline">{t("common.proPrice")}</span>
        </Button>
        <Button
          size="icon-sm"
          onClick={handleNewWorkout}
          aria-label={t("common.newWorkout")}
          className="order-1 lg:hidden"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleNewWorkout} className="hidden gap-1.5 lg:inline-flex">
          <Plus className="h-4 w-4" />
          <span>{t("common.newWorkout")}</span>
        </Button>
        <div className="relative order-2" ref={profileMenuRef}>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label={t("topbar.profileMenu")}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            title={t("topbar.profileMenu")}
            className="relative overflow-hidden rounded-full p-0"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt={t("topbar.profile")}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border border-background bg-destructive px-1 text-[0.62rem] font-semibold leading-5 text-destructive-foreground">
                {unreadLabel}
              </span>
            )}
          </Button>
          {profileMenuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-label={t("topbar.profileMenu")}
              onKeyDown={handleProfileMenuKeyDown}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-border bg-card p-1.5 text-card-foreground shadow-xl shadow-black/20"
            >
              <ProfileMenuItem
                icon={User}
                label={t("topbar.profile")}
                onClick={() => goToProfileMenuItem("/profile")}
              />
              <ProfileMenuItem
                icon={MessageCircle}
                label={t("topbar.messages")}
                badge={unreadCount > 0 ? unreadLabel : undefined}
                onClick={() => goToProfileMenuItem("/profile#messages")}
              />
              <ProfileMenuItem
                icon={Settings}
                label={t("topbar.settings")}
                onClick={() => goToProfileMenuItem("/settings")}
              />
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
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
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

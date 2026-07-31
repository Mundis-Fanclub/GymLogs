"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ClipboardList,
  Clock3,
  Dumbbell,
  LayoutDashboard,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/workouts/new", labelKey: "common.newWorkout", icon: Plus, primary: true },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
  { href: "/logs", labelKey: "common.logs", icon: ClipboardList },
];

const LEFT_NAV_ITEMS = NAV_ITEMS.slice(0, 2);
const RIGHT_NAV_ITEMS = NAV_ITEMS.slice(3);

function formatElapsedTime(startedAt: number, now: number) {
  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useAppPreferences();
  const { userId } = useConvexUser();
  const primaryItem = NAV_ITEMS.find((item) => item.primary)!;
  const activeWorkout = useQuery(
    api.workouts.getActiveForNav,
    userId ? { userId } : "skip"
  );
  const [now, setNow] = useState(Date.now());
  const [workoutOverlayOpen, setWorkoutOverlayOpen] = useState(false);
  const [overlayDragY, setOverlayDragY] = useState(0);
  const barPointerStartY = useRef<number | null>(null);
  const overlayPointerStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!activeWorkout) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [activeWorkout]);

  const PrimaryIcon = primaryItem.icon;
  const activeWorkoutName = activeWorkout?.name ?? t("common.activeWorkout");
  const isWorkoutScene = pathname.startsWith("/workouts/new");
  const showActiveWorkoutLayer = Boolean(activeWorkout) && !isWorkoutScene;

  useEffect(() => {
    if (!activeWorkout || isWorkoutScene) {
      setWorkoutOverlayOpen(false);
      setOverlayDragY(0);
    }
  }, [activeWorkout, isWorkoutScene]);

  function handleActiveWorkoutPointerUp(clientY: number) {
    const startY = barPointerStartY.current;
    barPointerStartY.current = null;
    if (startY !== null && startY - clientY > 28) {
      setWorkoutOverlayOpen(true);
    }
  }

  function handleWorkoutOverlayPointerUp(clientY: number) {
    const startY = overlayPointerStartY.current;
    overlayPointerStartY.current = null;
    const distance = startY === null ? 0 : clientY - startY;
    setOverlayDragY(0);
    if (distance > 76) {
      setWorkoutOverlayOpen(false);
    }
  }

  function renderSideItem({ href, labelKey, icon: Icon }: (typeof NAV_ITEMS)[number]) {
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
      <AppNavLink
        key={href}
        href={href}
        active={active}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 pt-1.5 text-[10px] font-medium leading-none transition-[color,transform] duration-200 ease-out active:scale-[0.96]",
          active ? "text-primary" : "text-muted-foreground/62 hover:text-foreground/85"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-transform duration-200 ease-out",
            active && "scale-[1.08]"
          )}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span className="max-w-full truncate">{t(labelKey)}</span>
        {active && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 h-0.5 w-9 rounded-full bg-primary"
          />
        )}
      </AppNavLink>
    );
  }

  const primaryActive = pathname === primaryItem.href || pathname.startsWith(primaryItem.href + "/");

  return (
    <>
      {showActiveWorkoutLayer && activeWorkout && (
        <div
          className="pointer-events-none fixed inset-0 z-30 md:hidden"
        >
          <section
            className={cn(
              "pointer-events-auto absolute inset-0 overflow-hidden border-t border-border bg-background shadow-2xl shadow-black/35 transition-transform duration-300 ease-out",
              !workoutOverlayOpen && "pointer-events-none"
            )}
            style={{
              transform: workoutOverlayOpen
                ? `translateY(${overlayDragY}px)`
                : "translateY(100%)",
              transitionDuration: workoutOverlayOpen && overlayDragY > 0 ? "0ms" : undefined,
            }}
            aria-hidden={!workoutOverlayOpen}
          >
            <div
              className="h-full overflow-auto px-4 pb-[calc(env(safe-area-inset-bottom)+6.25rem)] pt-3"
            >
              <button
                type="button"
                className="sticky top-0 z-20 mx-auto mb-3 flex h-10 w-32 touch-none items-center justify-center rounded-full bg-background/85 backdrop-blur"
                aria-label="Workout einklappen"
                onPointerDown={(event) => {
                  overlayPointerStartY.current = event.clientY;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (overlayPointerStartY.current === null) return;
                  setOverlayDragY(Math.max(0, event.clientY - overlayPointerStartY.current));
                }}
                onPointerUp={(event) => handleWorkoutOverlayPointerUp(event.clientY)}
                onPointerCancel={() => {
                  overlayPointerStartY.current = null;
                  setOverlayDragY(0);
                }}
              >
                <span className="h-1.5 w-14 rounded-full bg-muted-foreground/35" />
              </button>
              <ActiveWorkout
                workoutId={activeWorkout._id as Id<"workouts">}
                onRequestClose={() => setWorkoutOverlayOpen(false)}
                onContinue={() => setWorkoutOverlayOpen(false)}
              />
            </div>
          </section>
          {!workoutOverlayOpen && (
            <button
              type="button"
              onClick={() => setWorkoutOverlayOpen(true)}
              onPointerDown={(event) => {
                barPointerStartY.current = event.clientY;
              }}
              onPointerUp={(event) => handleActiveWorkoutPointerUp(event.clientY)}
              onPointerCancel={() => {
                barPointerStartY.current = null;
              }}
              className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+5.55rem)] left-1/2 flex h-14 w-[calc(100%-2rem)] max-w-[24.5rem] -translate-x-1/2 items-center justify-between gap-3 rounded-[1.05rem] border border-primary/40 bg-card/95 px-4 text-left shadow-2xl shadow-background/45 backdrop-blur-2xl transition-[transform,border-color,background-color,opacity] duration-200 ease-out hover:border-primary/60 hover:bg-card active:translate-y-0.5 active:scale-[0.99]"
              style={{
                backdropFilter: "blur(28px) saturate(175%)",
                WebkitBackdropFilter: "blur(28px) saturate(175%)",
              }}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Dumbbell className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-foreground">
                    {activeWorkoutName}
                  </span>
                  <span className="block text-xs font-medium text-muted-foreground">
                    {t("common.workoutRunning")}
                  </span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1 text-xs font-bold text-primary">
                <Clock3 className="h-3.5 w-3.5" />
                {formatElapsedTime(activeWorkout.startedAt, now)}
              </span>
            </button>
          )}
        </div>
      )}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
      <div
        className="pointer-events-auto relative mx-auto h-[4.15rem] w-full max-w-[24.5rem] rounded-[1.25rem] border border-border/80 bg-card/90 px-1.5 shadow-2xl shadow-background/45 backdrop-blur-2xl"
        style={{
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
        }}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_4.75rem_minmax(0,1fr)] items-center">
          <div className="flex h-full min-w-0">{LEFT_NAV_ITEMS.map(renderSideItem)}</div>
          <div aria-hidden="true" />
          <div className="flex h-full min-w-0">{RIGHT_NAV_ITEMS.map(renderSideItem)}</div>
        </div>
        <AppNavLink
          href={primaryItem.href}
          active={primaryActive}
          aria-current={primaryActive ? "page" : undefined}
          aria-label={t(primaryItem.labelKey)}
          className="absolute left-1/2 top-1/2 z-20 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-primary transition-[transform,color] duration-200 ease-out active:scale-[0.96]"
          style={{
            borderColor: "var(--primary)",
            boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--primary) 22%, transparent)",
          }}
        >
          <PrimaryIcon className={cn("h-6 w-6 transition-transform duration-200", primaryActive && "scale-[1.04]")} strokeWidth={2} />
        </AppNavLink>
      </div>
      </nav>
    </>
  );
}

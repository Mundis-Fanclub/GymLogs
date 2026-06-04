"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Logo } from "@/components/brand/Logo";
import { UserSearchButton } from "@/components/social/UserSearchButton";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  return (
    <aside className="hidden min-h-screen w-[15.5rem] shrink-0 flex-col border-r border-border bg-card/60 text-card-foreground md:flex">
      <div className="border-b border-border px-4 py-4">
        <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-lg transition hover:bg-muted/40">
          <Logo size={52} priority />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <UserSearchButton triggerClassName="mb-4 h-10 w-full justify-start rounded-lg border border-border/70 bg-background/60 px-3" />
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.99]",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />}
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </nav>
    </aside>
  );
}

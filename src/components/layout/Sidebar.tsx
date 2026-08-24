"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  MessageSquareText,
  Scale,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Logo } from "@/components/brand/Logo";
import { AppNavLink } from "./AppNavLink";

const UserSearchButton = dynamic(
  () => import("@/components/social/UserSearchButton").then((module) => module.UserSearchButton),
  { ssr: false }
);

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
];

const LEGAL_ITEMS = [
  { href: "/impressum", labelKey: "legal.common.impressum", icon: Scale },
  { href: "/datenschutz", labelKey: "legal.common.privacy", icon: Shield },
  { href: "/hinweise", labelKey: "legal.common.notices", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  return (
    <aside className="hidden min-h-screen w-[16rem] shrink-0 flex-col border-r border-border bg-sidebar/75 text-sidebar-foreground shadow-2xl shadow-black/25 backdrop-blur-2xl md:flex">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-2xl transition hover:bg-sidebar-accent/70">
          <Logo size={52} priority />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <UserSearchButton triggerClassName="mb-4 h-11 w-full justify-start rounded-2xl border border-border/70 bg-input/30 px-3" />
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.99]",
                active
                  ? "bg-brand/12 text-foreground ring-1 ring-brand/25"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
              )}
            >
              {active && <span className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full bg-primary shadow-[0_0_16px_var(--brand)]" />}
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </nav>
      <nav className="border-t border-sidebar-border px-3 py-3" aria-label={t("legal.common.legalNav")}>
        {LEGAL_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors",
                active ? "bg-brand/12 text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </nav>
    </aside>
  );
}

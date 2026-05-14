"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

type AppNavLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
> & {
  href: string;
  active?: boolean;
  children: ReactNode;
};

export function AppNavLink({
  href,
  active,
  children,
  onMouseEnter,
  onFocus,
  ...props
}: AppNavLinkProps) {
  const router = useRouter();

  function prefetchRoute() {
    router.prefetch(href);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (active) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        startTransition(() => router.push(href));
      });
      return;
    }

    startTransition(() => router.push(href));
  }

  return (
    <Link
      href={href}
      prefetch
      onClick={handleClick}
      onMouseEnter={(event) => {
        prefetchRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchRoute();
        onFocus?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

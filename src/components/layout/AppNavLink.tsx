"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
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

export const AppNavLink = forwardRef<HTMLAnchorElement, AppNavLinkProps>(
  function AppNavLink(
    { href, active, children, onMouseEnter, onFocus, ...props },
    ref
  ) {
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

      // Let Next.js handle the navigation. Manual router.push plus view
      // transitions made route changes feel slower on heavier pages.
    }

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={false}
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
);

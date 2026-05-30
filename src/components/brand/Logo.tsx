import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Renders both light- and dark-mode logos and lets Tailwind's `dark:`
 * variant pick the right one. The dark variant carries the white
 * "Logged" wordmark, the light variant uses near-black so it stays
 * readable on bright backgrounds.
 */
export function Logo({
  size = 32,
  className,
  priority = false,
  alt = "Logged",
}: LogoProps) {
  return (
    <span className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <Image
        src="/logo-light.svg"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        unoptimized
        className="block rounded-lg dark:hidden"
      />
      <Image
        src="/logo.svg"
        alt=""
        aria-hidden
        width={size}
        height={size}
        priority={priority}
        unoptimized
        className="hidden rounded-lg dark:block"
      />
    </span>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function Logo({ size = 32, className, priority = false, alt = "Logged" }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn("rounded-lg", className)}
    />
  );
}

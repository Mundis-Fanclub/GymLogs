"use client";

import Link from "next/link";
import { Apple, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthOptions({
  title,
  description,
  emailLabel,
  googleLabel,
  appleLabel,
}: {
  title: string;
  description: string;
  emailLabel: string;
  googleLabel: string;
  appleLabel: string;
}) {
  const signupHref = "/sign-up?onboarding=1";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-2">
        <Link href={signupHref}>
          <Button type="button" className="h-12 w-full justify-start rounded-lg text-base">
            <Mail className="h-5 w-5" />
            {emailLabel}
          </Button>
        </Link>
        <Link href={signupHref}>
          <Button type="button" variant="outline" className="h-12 w-full justify-start rounded-lg text-base">
            <span className="grid size-5 place-items-center rounded-full border border-border text-xs font-black">G</span>
            {googleLabel}
          </Button>
        </Link>
        <Link href={signupHref}>
          <Button type="button" variant="outline" className="h-12 w-full justify-start rounded-lg text-base">
            <Apple className="h-5 w-5" />
            {appleLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}

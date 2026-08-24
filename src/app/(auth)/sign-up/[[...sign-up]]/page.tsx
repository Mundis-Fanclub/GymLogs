"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { t } = useAppPreferences();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-2 text-foreground">
      <section className="flex min-h-[calc(100dvh-1rem)] w-full max-w-[390px] flex-col justify-center rounded-[22px] border border-border bg-background px-5 py-8 shadow-2xl shadow-black/45">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={86} priority alt="GymLogs" />
          <p className="text-xs text-muted-foreground">{t("auth.tagline")}</p>
        </div>
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold">{t("auth.signUpTitle")}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("auth.signUpCopy")}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-input/20 p-1.5">
            {!isLoaded || isSignedIn ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                {t("auth.loading")}
              </div>
            ) : (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "w-full border-0 bg-transparent shadow-none",
                  },
                }}
              />
            )}
          </div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label={t("legal.common.legalNav")}>
            <Link href="/impressum" className="transition hover:text-foreground">{t("legal.common.impressum")}</Link>
            <Link href="/datenschutz" className="transition hover:text-foreground">{t("legal.common.privacy")}</Link>
            <Link href="/hinweise" className="transition hover:text-foreground">{t("legal.common.notices")}</Link>
          </nav>
        </div>
      </section>
    </div>
  );
}

"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

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
          <p className="text-xs text-muted-foreground">Train. Track. Progress.</p>
        </div>
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold">Konto erstellen</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Erstelle dein Konto, um loszulegen.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-input/20 p-1.5">
            {!isLoaded || isSignedIn ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                Wird geladen...
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
        </div>
      </section>
    </div>
  );
}

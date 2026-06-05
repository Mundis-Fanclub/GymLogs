import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  const params = await searchParams;
  const onboarding = params?.onboarding === "1";
  const redirectUrl = onboarding ? "/onboarding/complete" : "/dashboard";
  if (userId) redirect(redirectUrl);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <Logo size={96} priority alt="Logged" />
      <SignIn
        signUpUrl={onboarding ? "/sign-up?onboarding=1" : "/sign-up"}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      />
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  const params = await searchParams;
  const onboarding = params?.onboarding === "1";
  const strategy = typeof params?.strategy === "string" ? params.strategy : undefined;
  const redirectUrl = onboarding ? "/onboarding/complete" : "/dashboard";
  if (userId) redirect(redirectUrl);

  return <AuthPageClient mode="sign-up" onboarding={onboarding} redirectUrl={redirectUrl} initialStrategy={strategy} />;
}

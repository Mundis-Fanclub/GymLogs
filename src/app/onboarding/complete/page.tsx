import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingCompleteClient } from "@/components/onboarding/OnboardingCompleteClient";

export default async function OnboardingCompletePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <OnboardingCompleteClient />;
}

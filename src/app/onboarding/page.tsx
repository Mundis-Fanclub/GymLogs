import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (userId) redirect("/onboarding/complete");

  return <OnboardingClient />;
}

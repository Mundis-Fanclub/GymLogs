import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export default async function Home() {
  const { userId } = await auth();
  const cookieStore = await cookies();
  const devAuthEnabled =
    process.env.NODE_ENV !== "production" &&
    cookieStore.get("gymlogs-dev-auth")?.value === "1";

  redirect(userId || devAuthEnabled ? "/dashboard" : "/onboarding");
}

import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <Logo size={96} priority alt="Logged" />
      <SignIn />
    </div>
  );
}

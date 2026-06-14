import { BottomNav } from "@/components/layout/BottomNav";
import { FabStartWorkout } from "@/components/layout/FabStartWorkout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-transparent p-0 text-foreground sm:p-2">
      <div className="relative flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-background sm:h-[calc(100dvh-1rem)] sm:max-w-[390px] sm:rounded-[22px] sm:border sm:border-border sm:shadow-2xl sm:shadow-black/45">
        <main className="min-h-0 flex-1 overflow-auto px-3 pb-[calc(env(safe-area-inset-bottom)+5.9rem)] pt-3 has-[[data-flush]]:pt-0">
          {children}
        </main>
        <FabStartWorkout />
        <BottomNav />
      </div>
    </div>
  );
}

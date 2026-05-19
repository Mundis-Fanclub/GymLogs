import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-background text-foreground md:flex">
      <Sidebar />
      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-auto px-3 pb-[calc(env(safe-area-inset-bottom)+6.25rem)] pt-3 has-[[data-flush]]:pt-0 sm:px-5 sm:pt-5 md:p-6 md:has-[[data-flush]]:pt-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

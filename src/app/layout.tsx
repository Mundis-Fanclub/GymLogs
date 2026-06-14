import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/dev/ThemeSwitcher";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymLogs",
  description: "Track your strength training performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${outfit.variable} overflow-hidden antialiased`}
        >
          <AppPreferencesProvider>
            <ConvexClientProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ConvexClientProvider>
          </AppPreferencesProvider>
          <ThemeSwitcher />
        </body>
      </html>
    </ClerkProvider>
  );
}

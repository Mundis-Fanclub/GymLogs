import type { Metadata } from "next";
import { Audiowide, Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/dev/ThemeSwitcher";
import "./globals.css";

const audiowide = Audiowide({
  variable: "--font-audiowide",
  weight: "400",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
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
          className={`${audiowide.variable} ${roboto.variable} antialiased`}
        >
          <AppPreferencesProvider>
            <ConvexClientProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ConvexClientProvider>
          </AppPreferencesProvider>
          {process.env.NODE_ENV === "development" && <ThemeSwitcher />}
        </body>
      </html>
    </ClerkProvider>
  );
}

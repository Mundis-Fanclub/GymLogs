import type { Metadata } from "next";
import { Audiowide, Mozilla_Text } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/dev/ThemeSwitcher";
import "./globals.css";

// Synchronously restore the persisted theme before React renders to
// avoid a flash of the default Orange palette on every page load.
const themeInitScript = `
(function(){try{var t=localStorage.getItem('gymlogs-theme');if(t&&t!=='orange')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
`;

const audiowide = Audiowide({
  variable: "--font-audiowide",
  weight: "400",
  subsets: ["latin"],
});

const mozillaText = Mozilla_Text({
  variable: "--font-mozilla-text",
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
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body
          className={`${audiowide.variable} ${mozillaText.variable} antialiased`}
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

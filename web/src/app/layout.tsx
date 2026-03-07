import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncUser } from "@/components/auth/SyncUser";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { CurrentUserProvider } from "./CurrentUserProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACS OBA Shepherds",
  description: "ACS OBA Shepherds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <TooltipProvider>
            <SyncUser />
            <CurrentUserProvider>
              {children}
            </CurrentUserProvider>
          </TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

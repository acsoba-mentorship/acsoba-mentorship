import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncUser } from "@/components/auth/SyncUser";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { CurrentUserProvider } from "./CurrentUserProvider";

const manrope = Manrope({
  variable: "--font-manrope",
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
        className={`${manrope.variable} antialiased`}
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

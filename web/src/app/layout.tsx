import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProviders } from "./AuthProviders";
import { SyncUser } from "@/components/auth/SyncUser";

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
      <AuthProviders>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUser />
          {children}
        </body>
      </AuthProviders>
    </html>
  );
}

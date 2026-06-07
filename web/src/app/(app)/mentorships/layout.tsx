import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ProtectedMenteeShell } from "@/components/auth/protected-mentee-shell";

export const metadata: Metadata = {
  title: "My Mentorships — ACS OBA Shepherds",
};

export default function MentorshipsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedMenteeShell>{children}</ProtectedMenteeShell>;
}
import type { Metadata } from "next";
import { ProtectedMenteeShell } from "@/components/auth/protected-mentee-shell";

export const metadata: Metadata = {
  title: "My Requests — ACS OBA Shepherds",
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedMenteeShell>{children}</ProtectedMenteeShell>;
}

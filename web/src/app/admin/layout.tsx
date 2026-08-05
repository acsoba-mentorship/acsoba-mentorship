import type { Metadata } from "next";

import { ProtectedAdminShell } from "@/components/auth/protected-admin-shell";

export const metadata: Metadata = {
  title: "Programme Administration — ACS OBA Shepherds",
  description: "Protected programme operations for ACS OBA Shepherds.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAdminShell>{children}</ProtectedAdminShell>;
}

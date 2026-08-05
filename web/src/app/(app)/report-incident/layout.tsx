import type { ReactNode } from "react";

import { ProtectedMenteeShell } from "@/components/auth/protected-mentee-shell";

export default function ReportIncidentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedMenteeShell>{children}</ProtectedMenteeShell>;
}

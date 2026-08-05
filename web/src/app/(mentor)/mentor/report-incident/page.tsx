import type { Metadata } from "next";

import { RoleIncidentReportPage } from "@/components/incidents/role-incident-report-page";

export const metadata: Metadata = {
  title: "Mentor Incident Report — ACS OBA Shepherds",
};

export default function MentorReportIncidentPage() {
  return <RoleIncidentReportPage role="mentor" />;
}

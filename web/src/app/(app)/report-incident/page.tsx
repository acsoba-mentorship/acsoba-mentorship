import type { Metadata } from "next";

import { RoleIncidentReportPage } from "@/components/incidents/role-incident-report-page";

export const metadata: Metadata = {
  title: "Report an Incident — ACS OBA Shepherds",
};

export default function ReportIncidentPage() {
  return <RoleIncidentReportPage role="mentee" />;
}

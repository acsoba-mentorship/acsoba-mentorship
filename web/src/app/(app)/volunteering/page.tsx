import type { Metadata } from "next";
import { VolunteeringTab } from "@/components/volunteering/volunteering-tab";

export const metadata: Metadata = {
  title: "Volunteering — ACS OBA Shepherds",
};

export default function VolunteeringPage() {
  return <VolunteeringTab />;
}

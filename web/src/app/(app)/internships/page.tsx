import { Briefcase } from "lucide-react";

import {
  InternshipsTabs,
  type InternshipTab,
} from "@/components/internships/internships-tabs";
import { OfferInternshipDialog } from "@/components/internships/offer-internship-dialog";

const INTERNSHIP_TABS = new Set<InternshipTab>([
  "browse",
  "my-postings",
  "my-interests",
]);

export default async function InternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const requestedTab = (await searchParams).tab;
  const tabValue = Array.isArray(requestedTab) ? requestedTab[0] : requestedTab;
  const activeTab: InternshipTab =
    tabValue && INTERNSHIP_TABS.has(tabValue as InternshipTab)
      ? (tabValue as InternshipTab)
      : "browse";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="size-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">Internships</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Members and alumni can offer internships, and members who are
              still in school or between jobs can indicate interest.
            </p>
          </div>
        </div>
        <OfferInternshipDialog />
      </div>

      <InternshipsTabs activeTab={activeTab} />
    </div>
  );
}

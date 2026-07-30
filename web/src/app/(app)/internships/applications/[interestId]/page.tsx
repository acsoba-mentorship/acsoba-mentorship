"use client";

import { useParams } from "next/navigation";

import type { Id } from "../../../../../../convex/_generated/dataModel";
import { ApplicationReview } from "@/components/internships/application-review";

export default function InternshipApplicationPage() {
  const params = useParams<{ interestId: string }>();

  return (
    <ApplicationReview
      interestId={params.interestId as Id<"internshipInterests">}
    />
  );
}

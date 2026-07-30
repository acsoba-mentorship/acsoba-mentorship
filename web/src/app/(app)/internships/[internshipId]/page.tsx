"use client";

import { useParams } from "next/navigation";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { InternshipDetails } from "@/components/internships/internship-details";

export default function InternshipDetailsPage() {
  const params = useParams<{ internshipId: string }>();

  return (
    <InternshipDetails
      internshipId={params.internshipId as Id<"internships">}
    />
  );
}

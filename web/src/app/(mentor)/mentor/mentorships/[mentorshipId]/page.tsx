"use client";

import { useParams } from "next/navigation";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { MentorshipWorkspace } from "@/components/mentorships/mentorship-workspace";

export default function MentorMentorshipDetailPage() {
  const params = useParams<{ mentorshipId: string }>();

  return (
    <MentorshipWorkspace
      mentorshipId={params.mentorshipId as Id<"mentorships">}
      canManageMeetings
    />
  );
}
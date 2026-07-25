import { AllMentorshipsTimeline } from "@/components/mentorships/all-mentorships-timeline";

export default function MentorMentorshipTimelinePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Timeline</h1>
        <p className="mt-2 text-muted-foreground">
          See meetings across all of your active mentorships in one timeline.
        </p>
      </div>

      <AllMentorshipsTimeline />
    </div>
  );
}
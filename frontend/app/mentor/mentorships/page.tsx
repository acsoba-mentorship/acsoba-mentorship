import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MentorMentorshipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Mentorships</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and manage your active mentorships, goals, objectives, and meetings.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50/50 p-6 dark:bg-gray-900/50">
        <h2 className="text-lg font-semibold">Active Mentorships</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          This page will display:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>List of current mentees</li>
          <li>Goals and objectives for each mentorship</li>
          <li>Upcoming and past meetings</li>
          <li>Progress tracking</li>
          <li>Option to pause or complete mentorships</li>
        </ul>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="font-medium">Mentorship Actions</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Quick actions for managing mentorships:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" disabled>
            Schedule Meeting (Coming Soon)
          </Button>
          <Button variant="outline" disabled>
            Add Goal (Coming Soon)
          </Button>
          <Button variant="outline" disabled>
            Track Progress (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}

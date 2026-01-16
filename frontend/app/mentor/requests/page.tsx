import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MentorRequestsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Requests</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and respond to incoming mentorship requests from mentees.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50/50 p-6 dark:bg-gray-900/50">
        <h2 className="text-lg font-semibold">Pending Requests</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          This page will display:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Incoming mentorship requests</li>
          <li>Mentee profiles and information</li>
          <li>Request messages and goals</li>
          <li>Accept/Reject buttons for each request</li>
          <li>History of past requests</li>
        </ul>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="font-medium">Request Actions</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Actions for handling requests:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="default" disabled>
            Accept Request (Coming Soon)
          </Button>
          <Button variant="destructive" disabled>
            Reject Request (Coming Soon)
          </Button>
          <Button variant="outline" disabled>
            View Mentee Profile (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}

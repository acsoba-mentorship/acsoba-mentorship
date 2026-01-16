import Link from "next/link";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/dummy-data";

export default function MentorDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {currentUser.firstName}! Manage your mentorship activities here.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50/50 p-6 dark:bg-gray-900/50">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Navigate to different sections of your mentor dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/mentor/profile">Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mentor/requests">View Requests</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mentor/mentorships">Manage Mentorships</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Profile</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Set up your mentor profile, expertise, and mentee limits.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto p-0">
            <Link href="/mentor/profile">Go to Profile →</Link>
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Mentorship Requests</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Review and respond to incoming mentorship requests.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto p-0">
            <Link href="/mentor/requests">View Requests →</Link>
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Active Mentorships</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage goals, objectives, and meetings with your mentees.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto p-0">
            <Link href="/mentor/mentorships">Manage Mentorships →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

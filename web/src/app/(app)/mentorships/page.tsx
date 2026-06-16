import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveMentorshipsForMentee } from "@/components/mentorships/active-mentorships";

export default function MenteeMentorshipsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Mentorships</h1>
          <p className="mt-2 text-muted-foreground">
            View your active mentorships and keep track of your mentor
            relationships.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/mentorships/timeline">
            <CalendarDays className="size-4" />
            View Timeline
          </Link>
        </Button>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Active Mentorships
          </h2>
          <p className="text-sm text-muted-foreground">
            These are mentorships created when mentors accept your requests.
          </p>
        </div>

        <ActiveMentorshipsForMentee />
      </section>
    </div>
  );
}
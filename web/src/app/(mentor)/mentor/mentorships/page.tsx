import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveMentorshipsForMentor } from "@/components/mentorships/active-mentorships";

export default function MentorMentorshipsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentorships</h1>
          <p className="mt-2 text-muted-foreground">
            View your active mentee relationships and manage each mentorship.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/mentor/mentorships/timeline">
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
            These are mentorships created when you accept mentee requests.
          </p>
        </div>

        <ActiveMentorshipsForMentor />
      </section>
    </div>
  );
}
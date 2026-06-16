import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActiveMentorshipsForMentor } from "@/components/mentorships/active-mentorships";

export const metadata: Metadata = {
  title: "Manage Mentorships — ACS OBA Shepherds",
};

export default function MentorMentorshipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Mentorships</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your active mentorships, goals, objectives, and
          meetings.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Active Mentorships
          </h2>
          <p className="text-sm text-muted-foreground">
            These are mentorships created from accepted mentee requests.
          </p>
        </div>

        <ActiveMentorshipsForMentor />
      </section>
    </div>
  );
}
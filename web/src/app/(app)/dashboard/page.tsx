import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Users,
  Send,
  Calendar,
  ArrowRight,
  BookOpen,
  HandHeart,
} from "lucide-react";
import { SuggestedMentors } from "@/components/dashboard/suggested-mentors";
import { PulseSurveyReminder } from "@/components/dashboard/pulse-survey-reminder";

const stats = [
  { label: "Active Mentorships", value: "0", icon: Users },
  { label: "Pending Requests", value: "0", icon: Send },
  { label: "Upcoming Sessions", value: "0", icon: Calendar },
] as const;

export const metadata: Metadata = {
  title: "Dashboard — ACS OBA Shepherds",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here&apos;s an overview of your mentorship activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-md bg-primary/10 p-2.5">
                <stat.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <PulseSurveyReminder />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into common tasks to manage your mentorship journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/search">
                <Search className="mr-2 size-4" />
                Find a Mentor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile">
                <BookOpen className="mr-2 size-4" />
                Update Profile
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mentorships">
                <Users className="mr-2 size-4" />
                View Mentorships
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/volunteering">
                <HandHeart className="mr-2 size-4" />
                Volunteering
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Mentors */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Suggested Mentors</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">
              View all
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <SuggestedMentors />
      </div>

      {/* Empty Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your mentorship interactions will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <Calendar className="size-8 text-primary/40" />
            </div>
            <p className="mt-4 font-medium">No recent activity</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by finding a mentor to begin your journey.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

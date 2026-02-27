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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Send,
  Calendar,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const stats = [
  { label: "Active Mentorships", value: "0", icon: Users },
  { label: "Pending Requests", value: "0", icon: Send },
  { label: "Upcoming Sessions", value: "0", icon: Calendar },
] as const;

const suggestedMentors = [
  {
    name: "Emma Wilson",
    title: "Senior ML Engineer",
    expertise: ["Machine Learning", "Python"],
    initials: "EW",
  },
  {
    name: "Alex Johnson",
    title: "Engineering Manager",
    expertise: ["Full Stack", "Leadership"],
    initials: "AJ",
  },
  {
    name: "Sarah Chen",
    title: "Lead Data Scientist",
    expertise: ["Data Science", "Healthcare"],
    initials: "SC",
  },
];

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
              <div className="rounded-md bg-muted p-2.5">
                <stat.icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Suggested Mentors */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Suggested Mentors</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">
              View all
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestedMentors.map((mentor) => (
            <Card key={mentor.name}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>{mentor.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {mentor.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mentor.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <div className="rounded-full bg-muted p-4">
              <Calendar className="size-8 text-muted-foreground/50" />
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

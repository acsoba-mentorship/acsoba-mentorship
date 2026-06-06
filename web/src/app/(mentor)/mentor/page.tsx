import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Inbox, Users } from "lucide-react";

const quickLinks = [
  {
    title: "Mentor Profile",
    description: "Set up your mentor profile, expertise, and mentee limits.",
    href: "/profile",
    icon: UserCog,
  },
  {
    title: "Mentorship Requests",
    description: "Review and respond to incoming mentorship requests.",
    href: "/mentor/requests",
    icon: Inbox,
  },
  {
    title: "Active Mentorships",
    description: "Manage goals, objectives, and meetings with your mentees.",
    href: "/mentor/mentorships",
    icon: Users,
  },
] as const;

export const metadata: Metadata = {
  title: "Mentor Dashboard — ACS OBA Shepherds",
};

export default function MentorDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your mentorship activities here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Navigate to different sections of your mentor dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/profile">Manage Mentor Profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mentor/requests">View Requests</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mentor/mentorships">Manage Mentorships</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <item.icon className="size-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
              <Button asChild variant="link" className="mt-3 h-auto p-0">
                <Link href={item.href}>Go to {item.title} &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

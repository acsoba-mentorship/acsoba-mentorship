import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

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

      <Card>
        <CardHeader>
          <CardTitle>Active Mentorships</CardTitle>
          <CardDescription>
            Your active mentorships and their status will be displayed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-muted p-4">
              <Users className="size-8 text-muted-foreground/50" />
            </div>
            <p className="mt-4 font-medium">No active mentorships</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your active mentorships will appear here once requests are
              accepted.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mentorship Actions</CardTitle>
          <CardDescription>
            Quick actions for managing your mentorships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
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
        </CardContent>
      </Card>
    </div>
  );
}

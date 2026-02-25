import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export default function MentorRequestsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Review and respond to incoming mentorship requests from mentees.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4">
            <Inbox className="size-8 text-muted-foreground/50" />
          </div>
          <CardTitle className="mt-4 text-base">No pending requests</CardTitle>
          <CardDescription className="mt-1 text-center">
            You&apos;re all caught up! New requests from mentees will appear
            here.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

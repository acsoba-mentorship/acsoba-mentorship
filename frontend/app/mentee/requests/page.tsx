import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMentorshipRequestsForMentee, currentUser } from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Send } from "lucide-react";

export default function MenteeRequestsPage() {
  const requests = getMentorshipRequestsForMentee(currentUser.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Track the status of your mentorship requests
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {request.mentor.firstName} {request.mentor.lastName}
                    </CardTitle>
                    <CardDescription>{request.mentor.title}</CardDescription>
                  </div>
                  <StatusBadge status={request.status} type="request" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your message:</p>
                  <p className="mt-1 text-sm">{request.message}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Sent {formatDate(request.createdAt)}</span>
                  {request.status === "pending" && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Cancel Request
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-medium">No requests yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by finding a mentor and sending a request
            </p>
            <Button asChild className="mt-4">
              <Link href="/mentee/search">Find Mentors</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

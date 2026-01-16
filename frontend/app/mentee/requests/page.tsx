import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMentorshipRequestsForMentee, currentUser } from "@/lib/dummy-data";
import { Clock, CheckCircle, XCircle, Send } from "lucide-react";

export default function MenteeRequestsPage() {
  const requests = getMentorshipRequestsForMentee(currentUser.id);

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    accepted: <CheckCircle className="h-4 w-4 text-green-500" />,
    rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

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
                  <Badge className={statusColors[request.status]}>
                    <span className="flex items-center gap-1">
                      {statusIcons[request.status]}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your message:</p>
                  <p className="mt-1 text-sm">{request.message}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Sent {new Date(request.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
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

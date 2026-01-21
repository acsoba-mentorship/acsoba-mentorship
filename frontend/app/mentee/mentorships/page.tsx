import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMentorshipsForMentee, currentUser } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users, Calendar, Target, MessageSquare } from "lucide-react";

export default function MenteeMentorshipsPage() {
  const mentorships = getMentorshipsForMentee(currentUser.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Mentorships</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your ongoing mentorship relationships
        </p>
      </div>

      {mentorships.length > 0 ? (
        <div className="space-y-4">
          {mentorships.map((mentorship) => {
            const initials = `${mentorship.mentor.firstName[0]}${mentorship.mentor.lastName[0]}`;
            return (
              <Card key={mentorship.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentorship.mentor.avatarUrl} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                        </CardTitle>
                        <CardDescription>{mentorship.mentor.title}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={mentorship.status} type="mentorship" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Meeting Frequency</p>
                        <p className="text-sm text-muted-foreground">
                          {mentorship.meetingFrequency}
                        </p>
                      </div>
                    </div>
                    {mentorship.nextMeetingDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Next Meeting</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(mentorship.nextMeetingDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {mentorship.goals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Goals</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mentorship.goals.map((goal, index) => (
                          <Badge key={index} variant="outline">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-medium">No active mentorships</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Find a mentor and start your learning journey
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

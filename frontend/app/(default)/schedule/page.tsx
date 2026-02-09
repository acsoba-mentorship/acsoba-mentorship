import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";

export default function SchedulePage() {
  // Placeholder upcoming meetings
  const upcomingMeetings = [
    {
      id: "1",
      mentorName: "Emma Wilson",
      date: "2024-06-20",
      time: "10:00 AM",
      duration: "1 hour",
      type: "Video Call",
      topic: "ML Fundamentals Discussion",
    },
    {
      id: "2",
      mentorName: "Alex Johnson",
      date: "2024-06-25",
      time: "3:00 PM",
      duration: "45 mins",
      type: "Video Call",
      topic: "Career Planning Session",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your upcoming mentorship sessions
        </p>
      </div>

      {/* Calendar View Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Your scheduled sessions at a glance</CardDescription>
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Sync Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/50">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Calendar view coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Upcoming Sessions</h2>
        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{meeting.topic}</h3>
                      <p className="text-sm text-muted-foreground">
                        with {meeting.mentorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        {new Date(meeting.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {meeting.time} · {meeting.duration}
                      </div>
                    </div>
                    <Button>Join Meeting</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium">No upcoming sessions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule a meeting with your mentor to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Past Sessions</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium">Session history</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your completed sessions will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { mockMentors } from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function FeaturedMentorsSection() {
  const featured = mockMentors.filter((m) => m.mentorProfile?.isAvailable).slice(0, 3);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Featured Mentors
          </h2>
          <p className="mt-4 text-muted-foreground">
            Meet some of the experienced professionals ready to guide you.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((mentor) => (
              <Card key={mentor.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{mentor.name}</CardTitle>
                      <CardDescription>{mentor.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {mentor.bio}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {mentor.location}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.mentorProfile?.expertise.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

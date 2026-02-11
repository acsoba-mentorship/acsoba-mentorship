import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { featuredMentors } from "./landing-content";

export function FeaturedMentorsSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Featured mentors
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              A glimpse of the types of mentors you can connect with. Filter by stack, domain, and
              experience when you search.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/search">Browse all mentors</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredMentors.map((mentor) => (
            <Card
              key={mentor.id}
              className="flex h-full flex-col border-muted/70 bg-background shadow-sm"
            >
              <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{mentor.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-base sm:text-lg">{mentor.name}</CardTitle>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    {mentor.domain}
                  </p>
                  <p className="text-xs text-muted-foreground">{mentor.title}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-sm text-muted-foreground">{mentor.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
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


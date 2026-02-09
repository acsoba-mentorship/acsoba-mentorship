import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentUser, getMentorUsersWithProfiles } from "@/lib/dummy-data";
import { 
  Search, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function ExplorePage() {
  const featuredMentors = getMentorUsersWithProfiles().slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {currentUser.firstName}!
        </h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          Discover resources, connect with mentors, and accelerate your learning journey.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Find a Mentor
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Link href="/profile">
              Complete Your Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Featured Mentors */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Featured Mentors</h2>
            <p className="text-sm text-muted-foreground">
              Top-rated mentors ready to help you grow
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/search">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredMentors.map((mentor) => (
            <Card key={mentor.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {mentor.firstName} {mentor.lastName}
                    </CardTitle>
                    <CardDescription>{mentor.title}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">4.9</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {mentor.mentorProfile?.bio}
                </p>
                <div className="my-3 flex flex-wrap gap-1">
                  {mentor.mentorProfile?.expertise.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {mentor.mentorProfile?.expertise?.length && mentor.mentorProfile?.expertise?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{mentor.mentorProfile?.expertise.length - 3}
                    </Badge>
                  )}
                </div>
                <Button asChild className="mt-auto w-full pt-3" variant="outline">
                  <Link href="/search">View Profile</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Learning Resources</h2>
          <p className="text-sm text-muted-foreground">
            Curated content to help you on your journey
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col justify-between h-full">
            <CardHeader>
              <CardTitle className="text-base">Getting Started Guide</CardTitle>
              <CardDescription>
                Learn how to make the most of your mentorship experience
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 mt-auto">
              <Button variant="link" className="h-auto p-0">
                Read guide →
              </Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-between h-full">
              <CardHeader>
                <CardTitle className="text-base">Goal Setting Workshop</CardTitle>
                <CardDescription>
                  Set effective goals for your mentorship journey
                </CardDescription>
              </CardHeader>
            <CardContent className="pt-0 mt-auto">
              <Button variant="link" className="h-auto p-0">
                Watch video →
              </Button>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-between h-full">
            <CardHeader>
              <CardTitle className="text-base">Community Forum</CardTitle>
              <CardDescription>
                Connect with other mentees and share experiences
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 mt-auto">
              <Button variant="link" className="h-auto p-0">
                Join discussion →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Search, Users, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const solutions = [
  {
    title: "Find Your Mentor",
    description:
      "Browse mentors by expertise, industry, and availability. Filter to find the perfect match for your goals.",
    icon: Search,
  },
  {
    title: "Build Relationships",
    description:
      "Connect with mentors through structured mentorships. Set goals, track progress, and grow together.",
    icon: Users,
  },
  {
    title: "Stay on Track",
    description:
      "Schedule regular sessions, set milestones, and keep your career development moving forward.",
    icon: CalendarCheck,
  },
] as const;

export function SolutionsSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-muted-foreground">
            A simple process to connect you with the right mentor.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <Card key={solution.title}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <solution.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <CardTitle className="mt-4">{solution.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {solution.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

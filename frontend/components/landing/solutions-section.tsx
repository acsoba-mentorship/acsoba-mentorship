import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, CalendarClock } from "lucide-react";

const solutions = [
  {
    icon: Search,
    title: "Search mentors by what you need",
    description:
      "Filter by role, experience level, skills, and goals so you’re not guessing who can actually help.",
  },
  {
    icon: Users,
    title: "Get matched with the right people",
    description:
      "See mentors who have solved problems like yours before, not just people with similar job titles.",
  },
  {
    icon: CalendarClock,
    title: "Meet regularly and track progress",
    description:
      "Set a cadence that works for both of you, keep notes in one place, and stay accountable over time.",
  },
];

export function SolutionsSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Mentor matching that starts with your real challenges.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Most people don&apos;t need another generic course. They need someone who&apos;s
            already navigated their specific path and can help them see the next few steps clearly.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="h-full border-muted/70 bg-muted/40 shadow-sm backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


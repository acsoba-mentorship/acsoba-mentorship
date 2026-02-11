import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";

export function HeroSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-20 lg:py-24">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            1:1 mentorship for real-world growth
          </div>

          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find a mentor who&apos;s been where you are.
            </h1>
            <p className="text-balance text-base text-muted-foreground sm:text-lg">
              Search mentors by experience, goals, and domain. Get matched with people who have
              actually solved the problems you&apos;re facing right now.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/search" aria-label="Find a mentor">
                Find a mentor
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-dashed sm:w-auto"
            >
              <Link href="/mentor" aria-label="Join as a mentor">
                Join as mentor
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            No generic advice. Just focused conversations with mentors who understand your path.
          </p>
        </div>

        <div className="flex-1 w-full max-w-md md:max-w-none">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}


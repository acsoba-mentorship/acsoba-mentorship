import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <main className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <GraduationCap className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Mentorship Platform
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Connect with experienced mentors to accelerate your growth. Find guidance,
            build skills, and achieve your goals through meaningful one-on-one relationships.
          </p>
        </div>

        <div className="mb-12 rounded-lg border bg-white/50 p-6 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            How it works
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Browse mentors by expertise, send connection requests, and schedule sessions
            that fit your schedule. Start your mentorship journey today.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/">
            Get Started
            <GraduationCap className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </main>
    </div>
  );
}

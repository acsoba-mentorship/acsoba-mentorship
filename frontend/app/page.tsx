import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <main className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Mentorship Platform
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Connect with mentors to accelerate your growth, or share your expertise
            to help others succeed.
          </p>
        </div>

        <div className="mb-12 rounded-lg border bg-white/50 p-6 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Choose Your Role
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Select how you want to use the platform. You can be both a mentor and a
            mentee.
          </p>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2">
          <Link
            href="/mentor"
            className="group flex flex-col items-center rounded-xl border bg-white p-8 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:bg-gray-800 dark:hover:border-gray-600"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              I&apos;m a Mentor
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Share your expertise, guide mentees, and make an impact.
            </p>
            <Button className="mt-4" variant="outline">
              Enter Mentor Dashboard
            </Button>
          </Link>

          <Link
            href="/mentee"
            className="group flex flex-col items-center rounded-xl border bg-white p-8 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:bg-gray-800 dark:hover:border-gray-600"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              I&apos;m a Mentee
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Find mentors, learn new skills, and grow your career.
            </p>
            <Button className="mt-4" variant="outline">
              Enter Mentee Dashboard
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          Note: Mentor access requires verification. Users can access both views.
        </p>
      </main>
    </div>
  );
}

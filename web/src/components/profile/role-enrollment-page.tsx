"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import {
  MenteeEnrollmentForm,
  MentorEnrollmentForm,
} from "@/components/profile/role-enrollment-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type EnrollmentRole = "mentee" | "mentor";

const enrollmentCopy: Record<
  EnrollmentRole,
  { title: string; description: string }
> = {
  mentor: {
    title: "Add a mentor profile",
    description:
      "Already a mentee? Add your reciprocal mentor role without repeating identity or membership verification.",
  },
  mentee: {
    title: "Add a mentee profile",
    description:
      "Already a mentor? Add your reciprocal mentee role without repeating identity or membership verification.",
  },
};

export function RoleEnrollmentPage({ role }: { role: EnrollmentRole }) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();
  const hasRole =
    role === "mentor"
      ? Boolean(currentUser?.mentorProfile)
      : Boolean(currentUser?.menteeProfile);

  useEffect(() => {
    if (!isLoading && currentUser && hasRole) {
      router.replace("/profile");
    }
  }, [currentUser, hasRole, isLoading, router]);

  if (isLoading || currentUser === undefined || hasRole) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const copy = enrollmentCopy[role];

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{copy.title}</CardTitle>
          <CardDescription className="leading-6">
            {copy.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role === "mentor" ? (
            <MentorEnrollmentForm />
          ) : (
            <MenteeEnrollmentForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

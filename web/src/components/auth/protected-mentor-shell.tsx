"use client";

import { redirect } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";

export function ProtectedMentorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useCurrentUser();

  if (isLoading || currentUser === undefined || currentUser === null) {
    return null;
  }

  if (!currentUser.mentorProfile) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

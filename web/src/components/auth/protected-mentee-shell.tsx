"use client";

import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/app/CurrentUserProvider";

export function ProtectedMenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useCurrentUser();

  const skeleton = (
    <div className="min-h-screen p-8">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-72" />
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );

  if (isLoading || currentUser === undefined || currentUser === null) {
    return skeleton;
  }

  if (!currentUser.menteeProfile) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedMentorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  const skeleton = (
    <div className="flex min-h-screen">
      <div className="w-64 border-r p-6">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <main className="flex-1 p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </main>
    </div>
  );

  if (currentUser === undefined) {
    return skeleton;
  }

  // Authenticated but user record not yet written by SyncUser — wait for it.
  if (isAuthenticated && currentUser === null) {
    return skeleton;
  }

  if (currentUser === null) {
    redirect("/");
  }

  if (!currentUser.mentorProfile) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

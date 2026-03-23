"use client";

import { redirect } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedMenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

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

  if (!currentUser.menteeProfile) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

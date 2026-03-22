"use client";

import { redirect } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedMenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    redirect("/");
  }

  if (!currentUser.menteeProfile) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

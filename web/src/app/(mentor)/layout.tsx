"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { RedirectToLanding } from "@/components/auth/redirects";
import { ProtectedMentorShell } from "@/components/auth/protected-mentor-shell";
import { MentorNav } from "@/components/navigation/mentor-nav";
import { MentorBreadcrumb } from "@/components/navigation/mentor-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

function MentorLoadingSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 border-r bg-muted/30 p-6 md:block">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-3 w-44 mb-8" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <main className="flex-1 p-8">
        <Skeleton className="h-4 w-40 mb-6" />
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
}

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <MentorLoadingSkeleton />
      </AuthLoading>

      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>

      <Authenticated>
        <ProtectedMentorShell>
          <div className="flex min-h-screen flex-col md:flex-row">
            <MentorNav />
            <main className="flex-1 overflow-auto">
              <div className="p-8">
                <div className="mb-6">
                  <MentorBreadcrumb />
                </div>
                {children}
              </div>
            </main>
          </div>
        </ProtectedMentorShell>
      </Authenticated>
    </>
  );
}

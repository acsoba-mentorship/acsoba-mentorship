"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToLanding } from "@/components/auth/redirects";
import { ProtectedMentorShell } from "@/components/auth/protected-mentor-shell";
import { MentorNav } from "@/components/navigation/mentor-nav";
import { MentorBreadcrumb } from "@/components/navigation/mentor-breadcrumb";
import { RequireOnboardingGuard } from "@/components/navigation/onboarding-guard";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>

      <Authenticated>
        <RequireOnboardingGuard>
          <ProtectedMentorShell>
            <div className="flex min-h-screen flex-col md:flex-row">
              <MentorNav />
              <main className="flex-1 overflow-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-6">
                    <MentorBreadcrumb />
                  </div>
                  {children}
                </div>
              </main>
            </div>
          </ProtectedMentorShell>
        </RequireOnboardingGuard>
      </Authenticated>
    </>
  );
}

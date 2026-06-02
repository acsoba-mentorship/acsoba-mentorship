"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SiteNav } from "@/components/navigation/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { RedirectToLanding } from "@/components/auth/redirects";
import { RequireOnboardingGuard } from "@/components/navigation/onboarding-guard";

export default function AppLayout({
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
          <div className="min-h-screen">
            <SiteNav />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <SiteFooter />
          </div>
        </RequireOnboardingGuard>
      </Authenticated>
    </>
  );
}

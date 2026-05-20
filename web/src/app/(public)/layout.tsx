"use client";

import { SiteNav } from "@/components/navigation/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToDashboard } from "@/components/auth/redirects";
import { RequireOnboardingGuard } from "@/components/navigation/onboarding-guard";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen">
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </div>
        </Unauthenticated>
      <Authenticated>
        <RequireOnboardingGuard>
          <RedirectToDashboard /> ``
        </RequireOnboardingGuard>
      </Authenticated>
    </>
  );
}

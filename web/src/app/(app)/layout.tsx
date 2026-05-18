"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SiteNav } from "@/components/navigation/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { RedirectToLanding } from "@/components/auth/redirect-to-landing";
import { Skeleton } from "@/components/ui/skeleton";

function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-36" />
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          App loading skeleton
          
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <AppLoadingSkeleton />
      </AuthLoading>

      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>

      <Authenticated>
        <div className="min-h-screen">
          <SiteNav />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </Authenticated>
    </>
  );
}

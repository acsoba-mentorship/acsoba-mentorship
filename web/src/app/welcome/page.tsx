"use client";

import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import LogoutButton from "@/components/LogoutButton";
import LoginButton from "@/components/LoginButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function WelcomeContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col gap-8 rounded-xl border p-8 shadow-lg">
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            ACS OBA Shepherds
          </h1>
          <p className="text-sm text-muted-foreground">
            You are signed in and can safely access your protected content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account overview</CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{currentUser.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{currentUser.email || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Onboarding status</dt>
                    <dd className="font-medium capitalize">
                      {currentUser.onboardingStatus || "new"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                From here you can continue onboarding, set up your mentee or
                mentor profile, or navigate to your dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Checking your session with Convex...
          </p>
        </div>
      </AuthLoading>

      <Authenticated>
        <WelcomeContent />
      </Authenticated>

      <Unauthenticated>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-xl border p-8 text-center shadow-lg">
            <h1 className="text-3xl font-bold md:text-4xl">
              Welcome to ACS OBA Shepherds
            </h1>
            <p className="text-lg text-muted-foreground">
              This page is protected. Please log in to access your personalized
              experience.
            </p>
            <LoginButton />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}

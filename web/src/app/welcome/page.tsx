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

function WelcomeContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col gap-8 rounded-3xl bg-slate-800/80 p-8 shadow-2xl ring-1 ring-white/5">
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">
            ACS OBA Shepherds
          </h1>
          <p className="text-sm text-slate-300">
            You are signed in and can safely access your protected content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-slate-700/60 p-6">
            <h2 className="text-lg font-semibold text-slate-100">
              Account overview
            </h2>
            {currentUser ? (
              <dl className="space-y-2 text-sm text-slate-200">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Name</dt>
                  <dd className="font-medium">{currentUser.name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Email</dt>
                  <dd className="font-medium">{currentUser.email || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Onboarding status</dt>
                  <dd className="font-medium capitalize">
                    {currentUser.onboardingStatus || "new"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-300">
                Loading your profile from Convex...
              </p>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-slate-700/60 p-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">
                Next steps
              </h2>
              <p className="text-sm text-slate-300">
                From here you can continue onboarding, set up your mentee or
                mentor profile, or navigate to your dashboard.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-slate-900">
          <p className="text-sm text-slate-300">
            Checking your session with Convex...
          </p>
        </div>
      </AuthLoading>

      <Authenticated>
        <WelcomeContent />
      </Authenticated>

      <Unauthenticated>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
          <div className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-3xl bg-slate-800/80 p-8 text-center shadow-2xl ring-1 ring-white/5">
            <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">
              Welcome to ACS OBA Shepherds
            </h1>
            <p className="text-lg text-slate-300">
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


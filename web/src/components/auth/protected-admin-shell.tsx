"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { ShieldCheck } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { RedirectToLanding } from "@/components/auth/redirects";
import { Skeleton } from "@/components/ui/skeleton";
import { ONBOARDING_START_PATH, ONBOARDING_STATUS } from "@/lib/onboarding";

function AdminGateLoading({ label = "Confirming administrator access" }) {
  return (
    <div className="flex min-h-screen bg-[#f7f6f2]">
      <div className="hidden w-72 shrink-0 bg-primary p-6 md:block">
        <Skeleton className="h-8 w-44 bg-white/15" />
        <Skeleton className="mt-3 h-4 w-52 bg-white/10" />
        <div className="mt-12 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <p className="mt-4 font-semibold">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Protected programme information stays hidden while your access is
            checked.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();
  const claimMyAccess = useMutation(api.admin.claimMyAccess);
  const access = useQuery(
    api.admin.getMyAccess,
    currentUser ? {} : "skip"
  );
  const claimStarted = useRef(false);

  useEffect(() => {
    if (!currentUser || access === undefined) {
      return;
    }

    if (access) {
      claimStarted.current = false;
      return;
    }

    if (claimStarted.current) {
      return;
    }
    claimStarted.current = true;

    void claimMyAccess()
      .then((claimedAccess) => {
        if (!claimedAccess) {
          router.replace(
            currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE
              ? "/dashboard"
              : ONBOARDING_START_PATH
          );
        }
      })
      .catch(() => {
        router.replace(
          currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE
            ? "/dashboard"
            : ONBOARDING_START_PATH
        );
      });
  }, [access, claimMyAccess, currentUser, router]);

  if (
    isLoading ||
    currentUser === undefined ||
    currentUser === null ||
    access === undefined
  ) {
    return <AdminGateLoading />;
  }

  if (!access) {
    return <AdminGateLoading label="Administrator access required" />;
  }

  return <>{children}</>;
}

export function ProtectedAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <AdminGateLoading />
      </AuthLoading>
      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>
      <Authenticated>
        <AdminAccessGate>{children}</AdminAccessGate>
      </Authenticated>
    </>
  );
}

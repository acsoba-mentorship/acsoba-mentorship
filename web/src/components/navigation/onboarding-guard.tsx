"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { ONBOARDING_START_PATH, ONBOARDING_STATUS } from "@/lib/onboarding";

export function RequireOnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  const isComplete = currentUser?.onboardingStatus === ONBOARDING_STATUS.COMPLETE;
  const needsRedirect = !isLoading && currentUser && !isComplete;

  useEffect(() => {
    if (needsRedirect) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [needsRedirect, router]);

  if (isLoading || currentUser === undefined || currentUser === null) {
    return null;
  }

  // Keep this here so that the guard prevents rendering the children on first page load.
  // This is a temporary fix, a better fix will be to use server side to handle this in the future.
  // This temporary fix is also at completed-onboarding-guard.tsx, protected-mentee-shell.tsx and protected-mentor-shell.tsx.
  if (!isComplete) {
    return null;
  }

  return <>{children}</>;
}

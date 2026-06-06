"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { ONBOARDING_STATUS, POST_ONBOARDING_PATH } from "@/lib/onboarding";

export default function CompletedOnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  const isComplete = currentUser?.onboardingStatus === ONBOARDING_STATUS.COMPLETE;
  const needsRedirect = !isLoading && currentUser && isComplete;

  useEffect(() => {
    if (needsRedirect) {
      router.replace(POST_ONBOARDING_PATH);
    }
  }, [needsRedirect, router]);

  if (isLoading || currentUser === undefined || currentUser === null) {
    return null;
  }

  if (isComplete) {
    return null;
  }

  return <>{children}</>;
}

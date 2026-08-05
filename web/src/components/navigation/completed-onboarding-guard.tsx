"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import {
  getCompletedOnboardingPath,
  ONBOARDING_PATHS,
  ONBOARDING_ROLE,
  ONBOARDING_STATUS,
} from "@/lib/onboarding";

export default function CompletedOnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading } = useCurrentUser();

  const isComplete = currentUser?.onboardingStatus === ONBOARDING_STATUS.COMPLETE;
  const needsRedirect = !isLoading && currentUser && isComplete;
  const intendedRole = pathname.startsWith(ONBOARDING_PATHS.mentor)
    ? ONBOARDING_ROLE.MENTOR
    : ONBOARDING_ROLE.MENTEE;
  const completedDestination = currentUser
    ? getCompletedOnboardingPath(currentUser, intendedRole)
    : null;

  useEffect(() => {
    if (needsRedirect && completedDestination) {
      router.replace(completedDestination);
    }
  }, [completedDestination, needsRedirect, router]);

  if (isLoading || currentUser === undefined || currentUser === null) {
    return null;
  }

  if (isComplete) {
    return null;
  }

  return <>{children}</>;
}

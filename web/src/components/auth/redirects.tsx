"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { ONBOARDING_START_PATH, ONBOARDING_STATUS } from "@/lib/onboarding";

export function RedirectToLanding() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}

export function RedirectToDashboard() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const claimMyAccess = useMutation(api.admin.claimMyAccess);
  const adminAccess = useQuery(
    api.admin.getMyAccess,
    currentUser ? {} : "skip"
  );
  const claimStarted = useRef(false);

  useEffect(() => {
    if (!currentUser || adminAccess === undefined) {
      return;
    }

    if (adminAccess) {
      router.replace("/admin");
      return;
    }

    if (claimStarted.current) {
      return;
    }
    claimStarted.current = true;

    void claimMyAccess()
      .then((claimedAccess) => {
        if (claimedAccess) {
          router.replace("/admin");
          return;
        }

        router.replace(
          currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE
            ? "/dashboard"
            : ONBOARDING_START_PATH
        );
      })
      .catch(() => {
        router.replace(
          currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE
            ? "/dashboard"
            : ONBOARDING_START_PATH
        );
      });
  }, [adminAccess, claimMyAccess, currentUser, router]);

  return null;
}

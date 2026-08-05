"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";

const EXIT_FEEDBACK_PATH = "/exit-feedback";

/**
 * Keeps every authenticated participant with outstanding exit feedback on the
 * compulsory form. This sits above all route-group layouts, so switching
 * between the mentee, mentor, and admin areas cannot bypass the requirement.
 */
export function PendingExitFeedbackGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated } = useCurrentUser();
  const pendingFeedback = useQuery(
    api.exitFeedback.listPendingMine,
    isAuthenticated && currentUser ? {} : "skip"
  );

  const hasPendingFeedback = Boolean(pendingFeedback?.length);
  const isExitFeedbackPage = pathname === EXIT_FEEDBACK_PATH;

  useEffect(() => {
    if (hasPendingFeedback && !isExitFeedbackPage) {
      router.replace(EXIT_FEEDBACK_PATH);
    }
  }, [hasPendingFeedback, isExitFeedbackPage, router]);

  useEffect(() => {
    if (!hasPendingFeedback) return;

    const preventLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", preventLeaving);
    return () => window.removeEventListener("beforeunload", preventLeaving);
  }, [hasPendingFeedback]);

  if (
    isAuthenticated &&
    currentUser &&
    pendingFeedback === undefined &&
    !isExitFeedbackPage
  ) {
    return null;
  }

  if (hasPendingFeedback && !isExitFeedbackPage) {
    return null;
  }

  return <>{children}</>;
}

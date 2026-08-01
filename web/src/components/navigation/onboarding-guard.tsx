"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { ONBOARDING_START_PATH, ONBOARDING_STATUS } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";

/**
 * Full-screen notice shown instead of the app when an admin has
 * temporarily suspended the signed-in user's account. The account remains
 * suspended until an admin reactivates it (see convex/model/admin.ts).
 */
function SuspendedAccountNotice({ reason }: { reason: string | null }) {
  const { logout } = useAuth0();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="text-xl font-bold text-primary">
        Your account has been temporarily suspended
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {reason
          ? reason
          : "An administrator has temporarily suspended your account. Contact ACSOBA support if you believe this is a mistake."}
      </p>
      <Button
        variant="outline"
        onClick={() =>
          void logout({
            logoutParams: {
              returnTo:
                typeof window !== "undefined"
                  ? window.location.origin
                  : undefined,
            },
          })
        }
      >
        Log out
      </Button>
    </div>
  );
}

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

  if (currentUser.accountStatus === "suspended") {
    return <SuspendedAccountNotice reason={currentUser.suspendedReason ?? null} />;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/app/CurrentUserProvider";

export function ProtectedMenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  const needsRedirect = !isLoading && currentUser && !currentUser.menteeProfile;

  useEffect(() => {
    if (needsRedirect) {
      router.replace("/profile/add-mentee");
    }
  }, [needsRedirect, router]);

  const skeleton = (
    <div className="min-h-screen p-8">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-72" />
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );

  if (isLoading || currentUser === undefined || currentUser === null) {
    return skeleton;
  }

  if (!currentUser.menteeProfile) {
    return null;
  }

  return <>{children}</>;
}

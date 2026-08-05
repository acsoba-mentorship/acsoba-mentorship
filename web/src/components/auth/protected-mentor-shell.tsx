"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/CurrentUserProvider";

export function ProtectedMentorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  const needsRedirect = !isLoading && currentUser && !currentUser.mentorProfile;

  useEffect(() => {
    if (needsRedirect) {
      router.replace("/profile/add-mentor");
    }
  }, [needsRedirect, router]);

  if (isLoading || currentUser === undefined || currentUser === null) {
    return null;
  }

  if (!currentUser.mentorProfile) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { MentorSidebar } from "@/components/profile/mentor-sidebar";
import { mockMentors } from "@/lib/mock-data";
import type { User } from "@/lib/types";
import { useConvexAuth } from "convex/react";
import { useCurrentUser } from "@/app/CurrentUserProvider";

function ProfileContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { currentUser, isOwnProfile } = useCurrentUser();

  const loading = isLoading || (isAuthenticated && currentUser === undefined);

  if (loading) {
    return <ProfileSkeleton />;
  }

  let user: User | null = null;

  if (userIdParam) {
    const mentor = mockMentors.find((m) => String(m._id) === userIdParam) ?? null;
    if (mentor) {
      user = mentor;
    } else if (currentUser) {
      user = currentUser;
    }
  } else if (currentUser) {
    user = currentUser;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <p className="text-sm text-muted-foreground">
          No profile available. Please sign in to view your profile.
        </p>
      </div>
    );
  }

  console.log(user)

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} />
      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProfileMainContent user={user} />
        <MentorSidebar user={user} isOwnProfile={isOwnProfile(String(user._id))} />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

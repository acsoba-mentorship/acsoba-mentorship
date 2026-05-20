import { useCurrentUser } from '@/app/CurrentUserProvider';
import { ONBOARDING_START_PATH, ONBOARDING_STATUS } from '@/lib/onboarding';
import { redirect } from 'next/navigation';
import React from 'react'

export function RequireOnboardingGuard({
    children
  }: {
    children: React.ReactNode;
  }) {
    const { currentUser, isLoading } = useCurrentUser();

    if (isLoading || currentUser === undefined || currentUser === null) {
        return null;
    }

    const isComplete = currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE;

    if (!isComplete) {
        redirect(ONBOARDING_START_PATH);
    }

    return (
        <>{children}</>
    );
}

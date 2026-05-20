import React from 'react'
import { useCurrentUser } from '../../app/CurrentUserProvider';
import { ONBOARDING_STATUS, POST_ONBOARDING_PATH } from '@/lib/onboarding';
import { redirect } from 'next/navigation';

export default function CompletedOnboardingGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser, isLoading } = useCurrentUser();

    if (isLoading || currentUser === undefined || currentUser === null) {
        return null;
    }

    const isComplete = currentUser.onboardingStatus === ONBOARDING_STATUS.COMPLETE;

    if (isComplete) {
        redirect(POST_ONBOARDING_PATH);
    }

    return (
        <>{children}</>
    );
}

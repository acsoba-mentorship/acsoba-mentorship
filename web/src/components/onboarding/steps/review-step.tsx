"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { GENDER_OPTIONS } from "@/lib/onboarding/constants";
import { buildOnboardingSubmitPayload } from "@/lib/onboarding/build-submit-payload";
import { POST_ONBOARDING_PATH } from "@/lib/onboarding";
import { MONTHS } from "@/lib/constants";

function monthLabel(month: number) {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month);
}

export function ReviewStep() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { draft, resetDraft } = useOnboardingDraft();
  const completeOnboarding = useMutation(api.users.setUserOnboardingComplete);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const email = currentUser?.email ?? "";
  const personal = draft.personal;
  const career = draft.career;
  const interestsChapter = draft.interestsChapter;
  const mentoring = draft.mentoring;

  const genderLabel =
    GENDER_OPTIONS.find((g) => g.value === personal?.gender)?.label ??
    personal?.gender;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = buildOnboardingSubmitPayload(draft, email);
      await completeOnboarding(payload);
      router.replace(POST_ONBOARDING_PATH);
      resetDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      title="Review your profile"
      description="Check everything looks right before we save."
      footer={
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Finish setup"}
        </Button>
      }
    >
      <div className="space-y-6 text-sm">
        <section className="rounded-xl border p-4">
          <h2 className="mb-2 font-semibold">About you</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <span className="text-foreground">
                {personal?.firstName} {personal?.lastName}
              </span>
            </li>
            <li>{email}</li>
            <li>{personal?.phoneNumber}</li>
            <li>{personal?.nationality}</li>
            <li>
              Birthday: {personal?.birthDay} {monthLabel(personal?.birthMonth ?? 1)}{" "}
              {personal?.birthYear}
            </li>
            <li>Gender: {genderLabel}</li>
          </ul>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="mb-2 font-semibold">Background</h2>
          {career?.careerStage === "student" && draft.studentBackground ? (
            <ul className="space-y-1 text-muted-foreground">
              <li className="text-foreground">Student</li>
              <li>{draft.studentBackground.institution}</li>
              <li>{draft.studentBackground.degree}</li>
              <li>{draft.studentBackground.fieldOfStudy}</li>
              <li>
                Since {monthLabel(draft.studentBackground.startMonth)}{" "}
                {draft.studentBackground.startYear}
              </li>
            </ul>
          ) : null}
          {career?.careerStage === "professional" && draft.workingBackground ? (
            <ul className="space-y-1 text-muted-foreground">
              <li className="text-foreground">Currently working</li>
              <li>
                {draft.workingBackground.title} at {draft.workingBackground.company}
              </li>
              <li>
                Since {monthLabel(draft.workingBackground.startMonth)}{" "}
                {draft.workingBackground.startYear}
              </li>
            </ul>
          ) : null}
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="mb-2 font-semibold">Interests</h2>
          <p className="mb-1 font-medium text-foreground">Industries</p>
          <p className="text-muted-foreground">
            {interestsChapter?.industries.join(", ")}
          </p>
          <p className="mb-1 mt-3 font-medium text-foreground">Topics</p>
          <p className="text-muted-foreground">
            {interestsChapter?.interests.join(", ")}
          </p>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="mb-2 font-semibold">Mentoring preferences</h2>
          <ul className="space-y-1 text-muted-foreground">
            <li>Commitment: {mentoring?.commitmentLevel}</li>
            <li>
              Communication:{" "}
              {mentoring?.preferredCommunicationModes.join(", ")}
            </li>
            <li className="pt-2 text-foreground">{mentoring?.goals}</li>
          </ul>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </OnboardingShell>
  );
}

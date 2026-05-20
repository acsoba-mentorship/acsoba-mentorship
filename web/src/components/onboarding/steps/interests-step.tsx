"use client";

import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PresetMultiSelect } from "@/components/onboarding/preset-multi-select";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import {
  ONBOARDING_TAG_MAX,
  ONBOARDING_TAG_MIN,
  PRESET_INDUSTRIES,
  PRESET_INTERESTS,
} from "@/lib/onboarding/constants";
import { interestsChapterSchema } from "@/lib/validation/onboarding";

export function InterestsStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();
  const [industries, setIndustries] = useState<string[]>(
    draft.interestsChapter?.industries ?? []
  );
  const [interests, setInterests] = useState<string[]>(
    draft.interestsChapter?.interests ?? []
  );
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    const parsed = interestsChapterSchema.safeParse({ industries, interests });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please complete both sections");
      return;
    }

    setError(null);
    const nextDraft = { ...draft, interestsChapter: parsed.data };
    updateDraft({ interestsChapter: parsed.data });
    goNext(nextDraft);
  };

  const valid =
    industries.length >= ONBOARDING_TAG_MIN &&
    industries.length <= ONBOARDING_TAG_MAX &&
    interests.length >= ONBOARDING_TAG_MIN &&
    interests.length <= ONBOARDING_TAG_MAX;

  return (
    <OnboardingShell
      title="Let's know more about your interests"
      footer={
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!valid}
          onClick={handleContinue}
        >
          Continue
        </Button>
      }
    >
      <div className="space-y-10">
        <PresetMultiSelect
          title="Industries you are interested in"
          description="Pick the sectors you'd like to explore with a mentor."
          options={PRESET_INDUSTRIES}
          value={industries}
          onChange={setIndustries}
        />
        <PresetMultiSelect
          title="We want to know more about what you like"
          description="Topics and themes you care about."
          options={PRESET_INTERESTS}
          value={interests}
          onChange={setInterests}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </OnboardingShell>
  );
}

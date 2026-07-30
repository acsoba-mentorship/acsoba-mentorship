"use client";

import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ChoiceButtons } from "@/components/onboarding/choice-buttons";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { CAREER_STAGE_UI } from "@/lib/onboarding/constants";
import { careerStageSchema } from "@/lib/validation/onboarding";

const CAREER_OPTIONS = [
  { value: CAREER_STAGE_UI.STUDENT, label: "I'm a student" },
  { value: CAREER_STAGE_UI.WORKING, label: "I'm currently working" },
  {
    value: CAREER_STAGE_UI.BETWEEN_STUDY_AND_WORK,
    label: "I'm looking for opportunities",
  },
] as const;

export function BackgroundStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();
  const [selected, setSelected] = useState<string | undefined>(
    draft.career?.careerStage
  );

  const handleContinue = () => {
    const parsed = careerStageSchema.safeParse({ careerStage: selected });
    if (!parsed.success) {
      return;
    }

    const nextDraft = {
      ...draft,
      career: parsed.data,
      studentBackground: undefined,
      workingBackground: undefined,
    };

    updateDraft({
      career: nextDraft.career,
      studentBackground: undefined,
      workingBackground: undefined,
    });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Which best describes you?"
      description="We'll tailor the next questions to your path."
      footer={
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue
        </Button>
      }
    >
      <ChoiceButtons
        options={CAREER_OPTIONS}
        value={selected}
        onChange={setSelected}
      />
    </OnboardingShell>
  );
}

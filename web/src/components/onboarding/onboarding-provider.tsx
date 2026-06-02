"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OnboardingDraft } from "./onboarding-draft";
import {
  getNextStep,
  getPreviousStep,
  type OnboardingStepId,
} from "@/lib/onboarding/steps";

type OnboardingContextValue = {
  draft: OnboardingDraft;
  step: OnboardingStepId;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  goNext: (draftForBranch?: OnboardingDraft) => void;
  goBack: () => void;
  resetDraft: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [step, setStep] = useState<OnboardingStepId>("profile");

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(
    (draftForBranch?: OnboardingDraft) => {
      const next = getNextStep(step, draftForBranch ?? draft);
      if (next) {
        setStep(next);
      }
    },
    [draft, step]
  );

  const goBack = useCallback(() => {
    const previous = getPreviousStep(step, draft);
    if (previous) {
      setStep(previous);
    }
  }, [draft, step]);

  const resetDraft = useCallback(() => {
    setDraft({});
    setStep("profile");
  }, []);

  const value = useMemo(
    () => ({ draft, step, updateDraft, goNext, goBack, resetDraft }),
    [draft, step, updateDraft, goNext, goBack, resetDraft]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingDraft() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingDraft must be used within OnboardingProvider");
  }
  return ctx;
}

export const useOnboarding = useOnboardingDraft;

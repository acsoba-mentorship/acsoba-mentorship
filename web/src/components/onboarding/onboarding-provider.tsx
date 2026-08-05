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
import type { OnboardingRole } from "@/lib/onboarding";

type OnboardingContextValue = {
  role: OnboardingRole;
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

export function OnboardingProvider({
  children,
  role,
}: {
  children: ReactNode;
  role: OnboardingRole;
}) {
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [step, setStep] = useState<OnboardingStepId>("profile");

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(
    (draftForBranch?: OnboardingDraft) => {
      const next = getNextStep(step, draftForBranch ?? draft, role);
      if (next) {
        setStep(next);
      }
    },
    [draft, role, step]
  );

  const goBack = useCallback(() => {
    const previous = getPreviousStep(step, draft, role);
    if (previous) {
      setStep(previous);
    }
  }, [draft, role, step]);

  const resetDraft = useCallback(() => {
    setDraft({});
    setStep("profile");
  }, []);

  const value = useMemo(
    () => ({ role, draft, step, updateDraft, goNext, goBack, resetDraft }),
    [role, draft, step, updateDraft, goNext, goBack, resetDraft]
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

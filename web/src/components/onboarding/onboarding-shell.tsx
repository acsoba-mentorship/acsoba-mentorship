"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPreviousStep, getProgressPercent } from "@/lib/onboarding/steps";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";

type OnboardingShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  description?: string;
};

export function OnboardingShell({
  children,
  footer,
  title,
  description,
}: OnboardingShellProps) {
  const { draft, step, goBack } = useOnboardingDraft();
  const progress = getProgressPercent(step);
  const previousStep = getPreviousStep(step, draft);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          {previousStep ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Go back"
              onClick={goBack}
            >
              <ChevronLeft className="size-5" />
            </Button>
          ) : (
            <div className="size-9 shrink-0" />
          )}
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8">
        {(title || description) && (
          <div className="mb-8 space-y-2 text-center">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        )}
        <div className={cn("flex-1", !title && !description && "pt-0")}>
          {children}
        </div>
      </main>

      {footer ? (
        <footer className="sticky bottom-0 border-t bg-background px-4 py-4">
          <div className="mx-auto w-full max-w-lg">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}

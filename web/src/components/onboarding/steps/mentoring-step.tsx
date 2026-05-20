"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn, countWords } from "@/lib/utils";
import {
  COMMITMENT_LEVEL_OPTIONS,
  GOALS_MAX_WORDS,
  PREFERRED_COMMUNICATION_MODE_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  mentoringChapterSchema,
  type MentoringChapterFormValues,
} from "@/lib/validation/onboarding";

export function MentoringStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();

  const form = useForm<MentoringChapterFormValues>({
    resolver: zodResolver(mentoringChapterSchema),
    defaultValues: draft.mentoring ?? {
      commitmentLevel: COMMITMENT_LEVEL_OPTIONS[0],
      preferredCommunicationModes: [],
      goals: "",
    },
  });

  const goalsValue = useWatch({ control: form.control, name: "goals" });
  const wordCount = countWords(goalsValue ?? "");

  const onSubmit = (values: MentoringChapterFormValues) => {
    const nextDraft = { ...draft, mentoring: values };
    updateDraft({ mentoring: values });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Your preferred mentoring style"
      description="Help us match you with the right mentors."
      footer={
        <Button
          type="submit"
          form="onboarding-mentoring-form"
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="onboarding-mentoring-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-10"
        >
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Commitment level</h2>
            <p className="text-sm text-muted-foreground">
              How often would you like to connect with a mentor?
            </p>
            <FormField
              control={form.control}
              name="commitmentLevel"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {COMMITMENT_LEVEL_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3",
                          field.value === option && "border-primary bg-primary/5"
                        )}
                      >
                        <input
                          type="radio"
                          className="size-4 accent-primary"
                          checked={field.value === option}
                          onChange={() => field.onChange(option)}
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Preferred communication</h2>
            <p className="text-sm text-muted-foreground">
              Select all that work for you.
            </p>
            <FormField
              control={form.control}
              name="preferredCommunicationModes"
              render={({ field }) => (
                <FormItem>
                  <div className="rounded-xl border bg-card p-2">
                    {PREFERRED_COMMUNICATION_MODE_OPTIONS.map((option) => {
                      const checked = field.value?.includes(option);
                      return (
                        <label
                          key={option}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3",
                            checked && "bg-muted/60"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const current = field.value ?? [];
                              if (isChecked) {
                                field.onChange([...current, option]);
                              } else {
                                field.onChange(
                                  current.filter((v) => v !== option)
                                );
                              }
                            }}
                          />
                          <span className="text-sm font-medium">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Goals</h2>
            <p className="text-sm text-muted-foreground">
              What do you hope to get from mentorship? ({GOALS_MAX_WORDS} words max)
            </p>
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-28 resize-none"
                      placeholder="e.g. I want guidance on breaking into product management…"
                    />
                  </FormControl>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground text-right",
                      wordCount > GOALS_MAX_WORDS && "text-destructive"
                    )}
                  >
                    {wordCount} / {GOALS_MAX_WORDS} words
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </form>
      </Form>
    </OnboardingShell>
  );
}

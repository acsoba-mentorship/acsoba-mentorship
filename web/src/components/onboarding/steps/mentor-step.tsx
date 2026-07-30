"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "../../../../convex/_generated/api";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { PresetMultiSelect } from "@/components/onboarding/preset-multi-select";
import { TagInput } from "@/components/profile/forms/tag-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mentorChapterSchema,
  type MentorChapterFormValues,
} from "@/lib/validation/onboarding";

export function MentorStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();
  const configuredOptions = useQuery(
    api.programSettings.getOnboardingOptions
  );
  const industryOptions: readonly string[] =
    configuredOptions?.industries ?? [];

  const form = useForm<MentorChapterFormValues>({
    resolver: zodResolver(mentorChapterSchema),
    defaultValues: draft.mentor ?? {
      yearsOfExperience: 0,
      maxMentees: 1,
      isAvailable: true,
      expertise: [],
      industries: [],
    },
  });

  const onSubmit = (values: MentorChapterFormValues) => {
    if (!values.industries.every((value) => industryOptions.includes(value))) {
      form.setError("industries", {
        message: "Available industries changed. Review your selection.",
      });
      return;
    }

    const nextDraft = { ...draft, mentor: values };
    updateDraft({ mentor: values });
    goNext(nextDraft);
  };

  if (configuredOptions === undefined) {
    return (
      <OnboardingShell
        title="Create your mentor profile"
        description="Loading the available industries…"
      >
        <div className="space-y-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title="Create your mentor profile"
      description="Share the experience you can offer to mentees."
      footer={
        <Button
          type="submit"
          form="onboarding-mentor-form"
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="onboarding-mentor-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of experience</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxMentees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum mentees</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="expertise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expertise</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add expertise (e.g. Leadership)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industries"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PresetMultiSelect
                    title="Industries"
                    description="Choose the sectors where you can guide mentees."
                    options={industryOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAvailable"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-xl border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>I am available for mentees</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    You can change your availability later from your mentor
                    profile.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </OnboardingShell>
  );
}

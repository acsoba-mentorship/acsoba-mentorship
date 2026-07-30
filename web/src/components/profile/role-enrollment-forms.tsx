"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../../convex/_generated/api";
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
import { Textarea } from "@/components/ui/textarea";
import {
  COMMITMENT_LEVEL_OPTIONS,
  GOALS_MAX_CHARACTERS,
  PREFERRED_COMMUNICATION_MODE_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  menteeEnrollmentSchema,
  mentorChapterSchema,
  type MenteeEnrollmentFormValues,
  type MentorChapterFormValues,
} from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to add this role.";
}

export function MentorEnrollmentForm() {
  const router = useRouter();
  const enrollAsMentor = useMutation(api.users.enrollAsMentor);
  const options = useQuery(api.programSettings.getOnboardingOptions);
  const industryOptions: readonly string[] = options?.industries ?? [];
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MentorChapterFormValues>({
    resolver: zodResolver(mentorChapterSchema),
    defaultValues: {
      yearsOfExperience: 0,
      maxMentees: 1,
      isAvailable: true,
      expertise: [],
      industries: [],
    },
  });

  const onSubmit = async (values: MentorChapterFormValues) => {
    if (!values.industries.every((value) => industryOptions.includes(value))) {
      form.setError("industries", {
        message: "Available industries changed. Review your selection.",
      });
      return;
    }

    setError(null);
    try {
      await enrollAsMentor({
        industries: values.industries,
        mentorProfile: {
          yearsOfExperience: values.yearsOfExperience,
          expertise: values.expertise,
          maxMentees: values.maxMentees,
          isAvailable: values.isAvailable,
          isVisible: true,
        },
      });
      router.replace("/mentor");
    } catch (mutationError) {
      setError(errorMessage(mutationError));
    }
  };

  if (options === undefined) {
    return <EnrollmentFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
                  You can change this later from your mentor profile.
                </p>
              </div>
            </FormItem>
          )}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.replace("/profile")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Adding mentor profile…"
              : "Add mentor profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function MenteeEnrollmentForm() {
  const router = useRouter();
  const enrollAsMentee = useMutation(api.users.enrollAsMentee);
  const options = useQuery(api.programSettings.getOnboardingOptions);
  const industryOptions: readonly string[] = options?.industries ?? [];
  const interestOptions: readonly string[] = options?.interests ?? [];
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MenteeEnrollmentFormValues>({
    resolver: zodResolver(menteeEnrollmentSchema),
    defaultValues: {
      interests: [],
      industries: [],
      commitmentLevel: COMMITMENT_LEVEL_OPTIONS[0],
      preferredCommunicationModes: [],
      goals: "",
    },
  });

  const onSubmit = async (values: MenteeEnrollmentFormValues) => {
    if (!values.interests.every((value) => interestOptions.includes(value))) {
      form.setError("interests", {
        message: "Available interests changed. Review your selection.",
      });
      return;
    }
    if (!values.industries.every((value) => industryOptions.includes(value))) {
      form.setError("industries", {
        message: "Available industries changed. Review your selection.",
      });
      return;
    }

    setError(null);
    try {
      await enrollAsMentee({
        interests: values.interests,
        industries: values.industries,
        menteeProfile: {
          goals: values.goals,
          commitmentLevel: values.commitmentLevel,
          preferredCommunicationModes: values.preferredCommunicationModes,
        },
      });
      router.replace("/dashboard");
    } catch (mutationError) {
      setError(errorMessage(mutationError));
    }
  };

  if (options === undefined) {
    return <EnrollmentFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <FormField
          control={form.control}
          name="industries"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PresetMultiSelect
                  title="Industries you are interested in"
                  description="Choose the sectors you would like to explore with a mentor."
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
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PresetMultiSelect
                  title="What would you like to develop?"
                  description="Choose the topics you want to explore with a mentor."
                  options={interestOptions}
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
          name="commitmentLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commitment level</FormLabel>
              <div className="space-y-2 pt-2">
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

        <FormField
          control={form.control}
          name="preferredCommunicationModes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred communication</FormLabel>
              <div className="space-y-2 rounded-xl border p-3">
                {PREFERRED_COMMUNICATION_MODE_OPTIONS.map((option) => {
                  const checked = field.value.includes(option);
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(isChecked) =>
                          field.onChange(
                            isChecked
                              ? [...field.value, option]
                              : field.value.filter((value) => value !== option)
                          )
                        }
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goals</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  maxLength={GOALS_MAX_CHARACTERS}
                  className="min-h-28 resize-none"
                  placeholder="What do you hope to get from mentorship?"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.replace("/profile")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Adding mentee profile…"
              : "Add mentee profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EnrollmentFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading onboarding options">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

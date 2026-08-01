"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  COMMITMENT_LEVEL_OPTIONS,
  PREFERRED_COMMUNICATION_MODE_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  menteePreferencesSchema,
  type MenteePreferencesFormValues,
} from "@/lib/validation/profile";
import { cn } from "@/lib/utils";
import type { PublicUserProfile } from "@/lib/types";

interface GoalsSectionFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

/**
 * Edits the mentee's goals, commitment level, and preferred way of being
 * contacted. These are collected during onboarding but should stay editable
 * afterwards (FR: users should be able to edit their onboarding data).
 */
export function GoalsSectionForm({ user, onSuccess }: GoalsSectionFormProps) {
  const updateMenteeProfileDetails = useMutation(
    api.users.updateMenteeProfileDetails
  );

  const form = useForm<MenteePreferencesFormValues>({
    resolver: zodResolver(menteePreferencesSchema),
    defaultValues: {
      goals: user.menteeProfile?.goals ?? "",
      commitmentLevel:
        user.menteeProfile?.commitmentLevel ?? COMMITMENT_LEVEL_OPTIONS[0],
      preferredCommunicationModes:
        user.menteeProfile?.preferredCommunicationModes ?? [],
    },
  });

  const onSubmit = async (values: MenteePreferencesFormValues) => {
    await updateMenteeProfileDetails({
      goals: values.goals,
      commitmentLevel: values.commitmentLevel,
      preferredCommunicationModes: values.preferredCommunicationModes,
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goals</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your mentee goals (e.g. career transition, skill development)."
                  className="min-h-24 resize-none"
                  {...field}
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

        <FormField
          control={form.control}
          name="preferredCommunicationModes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred way to be contacted</FormLabel>
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
                              current.filter((value) => value !== option)
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

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { goalsSchema, type GoalsFormValues } from "@/lib/validation/profile";
import type { PublicUserProfile } from "@/lib/types";

interface GoalsSectionFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

export function GoalsSectionForm({ user, onSuccess }: GoalsSectionFormProps) {
  const updateMenteeProfileDetails = useMutation(
    api.users.updateMenteeProfileDetails
  );

  const form = useForm<GoalsFormValues>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      goals: user.menteeProfile?.goals ?? "",
    },
  });

  const onSubmit = async (values: GoalsFormValues) => {
    await updateMenteeProfileDetails({
      goals: values.goals,
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

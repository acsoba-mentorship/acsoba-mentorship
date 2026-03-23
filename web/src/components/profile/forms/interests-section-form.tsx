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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  interestsSchema,
  type InterestsFormValues,
} from "@/lib/validation/profile";
import { TagInput } from "./tag-input";
import type { PublicUserProfile } from "@/lib/types";

interface InterestsSectionFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

export function InterestsSectionForm({
  user,
  onSuccess,
}: InterestsSectionFormProps) {
  const updateMenteeProfileDetails = useMutation(
    api.users.updateMenteeProfileDetails
  );

  const form = useForm<InterestsFormValues>({
    resolver: zodResolver(interestsSchema),
    defaultValues: {
      interests: user.menteeProfile?.interests ?? [],
    },
  });

  const onSubmit = async (values: InterestsFormValues) => {
    const goals = user.menteeProfile?.goals ?? "";
    await updateMenteeProfileDetails({
      goals,
      interests: values.interests,
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interests</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add an interest (e.g. React, Leadership)"
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

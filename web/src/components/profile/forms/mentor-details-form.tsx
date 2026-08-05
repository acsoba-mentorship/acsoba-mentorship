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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  mentorDetailsSchema,
  type MentorDetailsFormValues,
} from "@/lib/validation/profile";
import type { PublicUserProfile } from "@/lib/types";

interface MentorDetailsFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

const defaultMentor = {
  yearsOfExperience: 0,
  maxMentees: 1,
  isAvailable: false,
  isVisible: true,
  expertise: [] as string[],
};

export function MentorDetailsForm({
  user,
  onSuccess,
}: MentorDetailsFormProps) {
  const updateMentorProfile = useMutation(api.users.updateMentorProfile);
  const profile = user.mentorProfile ?? defaultMentor;

  const form = useForm<MentorDetailsFormValues>({
    resolver: zodResolver(mentorDetailsSchema),
    defaultValues: {
      yearsOfExperience: profile.yearsOfExperience,
      maxMentees: profile.maxMentees,
      isAvailable: profile.isAvailable,
      isVisible: profile.isVisible ?? true,
    }
  });

  const onSubmit = async (values: MentorDetailsFormValues) => {
    await updateMentorProfile({
      yearsOfExperience: values.yearsOfExperience,
      maxMentees: values.maxMentees,
      isAvailable: values.isAvailable,
      isVisible: values.isVisible,
      expertise: profile.expertise,
    });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  placeholder="e.g. 5"
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    field.onChange(Number.isNaN(v) ? 0 : v);
                  }}
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
              <FormLabel>Max mentees</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    field.onChange(Number.isNaN(v) ? 1 : v);
                  }}
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
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                I am available for new mentees
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-lg bg-muted/40 p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="cursor-pointer font-normal">
                  Show my profile in mentor discovery
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Turn this off to hide from search and recommendations without
                  affecting active mentorships.
                </p>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
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

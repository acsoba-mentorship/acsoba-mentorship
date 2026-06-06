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
  mentorExpertiseSchema,
  userIndustriesSchema,
  type MentorExpertiseFormValues,
} from "@/lib/validation/profile";
import { TagInput } from "./tag-input";
import type { PublicUserProfile } from "@/lib/types";
interface MentorExpertiseFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

const defaultMentor = {
  yearsOfExperience: 0,
  maxMentees: 1,
  isAvailable: false,
  expertise: [] as string[],
};

type MentorExpertiseFormInput = MentorExpertiseFormValues & {
  industries: string[];
};

const mentorExpertiseWithIndustriesSchema = mentorExpertiseSchema.extend({
  industries: userIndustriesSchema.shape.industries,
});

export function MentorExpertiseForm({
  user,
  onSuccess,
}: MentorExpertiseFormProps) {
  const updateMentorProfile = useMutation(api.users.updateMentorProfile);
  const updateUserIndustries = useMutation(api.users.updateUserIndustries);
  const profile = user.mentorProfile ?? defaultMentor;

  const form = useForm<MentorExpertiseFormInput>({
    resolver: zodResolver(mentorExpertiseWithIndustriesSchema),
    defaultValues: {
      industries: user.industries ?? [],
      expertise: profile.expertise,
    },
  });

  const onSubmit = async (values: MentorExpertiseFormInput) => {
    await Promise.all([
      updateUserIndustries({ industries: values.industries }),
      updateMentorProfile({
        yearsOfExperience: profile.yearsOfExperience,
        maxMentees: profile.maxMentees,
        isAvailable: profile.isAvailable,
        expertise: values.expertise,
      }),
    ]);
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="Add expertise (e.g. Machine Learning, Full Stack)"
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
              <FormLabel>Industries</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add industries (e.g. FinTech, Healthcare)"
                />
              </FormControl>
              <FormMessage />
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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENT_YEAR, MONTHS, YEAR_OPTIONS } from "@/lib/constants";
import {
  studentBackgroundSchema,
  type StudentBackgroundFormInput,
  type StudentBackgroundFormValues,
} from "@/lib/validation/onboarding";

export function EducationStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();

  const form = useForm<
    StudentBackgroundFormInput,
    unknown,
    StudentBackgroundFormValues
  >({
    resolver: zodResolver(studentBackgroundSchema),
    defaultValues: draft.studentBackground ?? {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startMonth: new Date().getMonth() + 1,
      startYear: CURRENT_YEAR,
    },
  });

  const onSubmit = (values: StudentBackgroundFormValues) => {
    const nextDraft = { ...draft, studentBackground: values };
    updateDraft({ studentBackground: values });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Where are you studying?"
      description="Add your current school — you can add more history later on your profile."
      footer={
        <Button
          type="submit"
          form="onboarding-education-form"
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="onboarding-education-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="University or school name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Degree / programme</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. BSc Computer Science" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fieldOfStudy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field of study</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Engineering" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start month</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start year</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

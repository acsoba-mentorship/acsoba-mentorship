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
  workingBackgroundSchema,
  type WorkingBackgroundFormValues,
} from "@/lib/validation/onboarding";

export function CareerStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();

  const form = useForm<WorkingBackgroundFormValues>({
    resolver: zodResolver(workingBackgroundSchema),
    defaultValues: draft.workingBackground ?? {
      company: "",
      title: "",
      startMonth: new Date().getMonth() + 1,
      startYear: CURRENT_YEAR,
    },
  });

  const onSubmit = (values: WorkingBackgroundFormValues) => {
    const nextDraft = { ...draft, workingBackground: values };
    updateDraft({ workingBackground: values });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Where are you working?"
      description="Your current role — add past jobs later on your profile."
      footer={
        <Button
          type="submit"
          form="onboarding-career-form"
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="onboarding-career-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your current role" />
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

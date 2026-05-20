"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCurrentUser } from "@/app/CurrentUserProvider";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  personalDetailsSchema,
  type PersonalDetailsFormValues,
} from "@/lib/validation/onboarding";
import { CURRENT_YEAR, MONTHS, YEAR_OPTIONS } from "@/lib/constants";
import { fromTimestamp } from "@/lib/utils";

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

export function ProfileStep() {
  const { currentUser } = useCurrentUser();
  const { draft, updateDraft, goNext } = useOnboardingDraft();
  const email = currentUser?.email ?? "";

  const existingDob =
    currentUser?.dateOfBirth && currentUser.dateOfBirth > 0
      ? fromTimestamp(currentUser.dateOfBirth)
      : null;

  const form = useForm<PersonalDetailsFormValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: draft.personal ?? {
      firstName: splitName(currentUser?.name ?? "").firstName,
      lastName: splitName(currentUser?.name ?? "").lastName,
      birthDay: existingDob?.day ?? 1,
      birthMonth: existingDob?.month ?? 1,
      birthYear: existingDob?.year ?? CURRENT_YEAR - 20,
      gender: "male",
      phoneNumber: currentUser?.phoneNumber ?? "",
      nationality: "Singapore",
    },
  });

  const onSubmit = (values: PersonalDetailsFormValues) => {
    const nextDraft = { ...draft, personal: values };
    updateDraft({ personal: values });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Create your account"
      description="Tell us a bit about yourself to get started."
      footer={
        <Button
          type="submit"
          form="onboarding-profile-form"
          className="w-full"
          size="lg"
          disabled={form.formState.isSubmitting}
        >
          Continue
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="onboarding-profile-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled readOnly className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              From your sign-in provider. Contact support if this looks wrong.
            </p>
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NATIONALITY_OPTIONS.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Label className="mb-2 block">Birthday</Label>
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="birthDay"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAY_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d}
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
                name="birthMonth"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
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
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
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
          </div>

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </OnboardingShell>
  );
}

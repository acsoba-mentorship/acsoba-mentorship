"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarClock, Loader2, Save, SlidersHorizontal } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminSuccess,
  formatAdminDateTime,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProgrammeSettings = FunctionReturnType<
  typeof api.programSettings.getForAdmin
>;

const settingDefinitions = [
  {
    key: "maxActiveMentorsPerMentee",
    label: "Maximum active mentors per mentee",
    description:
      "Limits each mentee's combined active relationships and live pending requests.",
    min: 1,
    max: 20,
    suffix: "mentors",
  },
  {
    key: "requestExpiryDays",
    label: "Mentorship request expiry",
    description:
      "Pending mentor requests expire automatically after this period.",
    min: 1,
    max: 60,
    suffix: "days",
  },
  {
    key: "pulseSurveyIntervalDays",
    label: "Pulse survey interval",
    description:
      "Sets how often active mentorship pairs receive relationship-health surveys.",
    min: 7,
    max: 365,
    suffix: "days",
  },
  {
    key: "exitSurveyDueDays",
    label: "Exit feedback due period",
    description:
      "Sets the completion window after exit feedback is assigned.",
    min: 1,
    max: 90,
    suffix: "days",
  },
] as const;

function catalogToText(values: readonly string[]) {
  return values.join("\n");
}

function textToCatalog(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ProgrammeSettingsForm({
  settings,
}: {
  settings: ProgrammeSettings;
}) {
  const updateSettings = useMutation(api.programSettings.updateForAdmin);
  const [values, setValues] = useState(() => ({
    maxActiveMentorsPerMentee: String(settings.maxActiveMentorsPerMentee),
    requestExpiryDays: String(settings.requestExpiryDays),
    pulseSurveyIntervalDays: String(settings.pulseSurveyIntervalDays),
    exitSurveyDueDays: String(settings.exitSurveyDueDays),
    onboardingIndustries: catalogToText(settings.onboardingIndustries),
    onboardingInterests: catalogToText(settings.onboardingInterests),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const parsedValues = {
      maxActiveMentorsPerMentee: Number(values.maxActiveMentorsPerMentee),
      requestExpiryDays: Number(values.requestExpiryDays),
      pulseSurveyIntervalDays: Number(values.pulseSurveyIntervalDays),
      exitSurveyDueDays: Number(values.exitSurveyDueDays),
      onboardingIndustries: textToCatalog(values.onboardingIndustries),
      onboardingInterests: textToCatalog(values.onboardingInterests),
    };

    try {
      await updateSettings(parsedValues);
      setSuccess("Programme operating settings were updated for all administrators.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {settingDefinitions.map((definition) => (
          <div
            key={definition.key}
            className="rounded-xl border border-primary/10 bg-[#faf8f1] p-5"
          >
            <label
              htmlFor={definition.key}
              className="text-sm font-semibold text-primary"
            >
              {definition.label}
            </label>
            <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
              {definition.description}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Input
                id={definition.key}
                type="number"
                required
                min={definition.min}
                max={definition.max}
                step={1}
                value={values[definition.key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [definition.key]: event.target.value,
                  }))
                }
                className="max-w-32 bg-background text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground">
                {definition.suffix}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Allowed range: {definition.min}–{definition.max}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-primary/10 bg-[#faf8f1] p-5">
          <label
            htmlFor="onboardingIndustries"
            className="text-sm font-semibold text-primary"
          >
            Onboarding industries
          </label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enter one industry per line, in the order members should see them.
          </p>
          <Textarea
            id="onboardingIndustries"
            required
            value={values.onboardingIndustries}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                onboardingIndustries: event.target.value,
              }))
            }
            className="mt-4 min-h-48 bg-background"
          />
        </div>
        <div className="rounded-xl border border-primary/10 bg-[#faf8f1] p-5">
          <label
            htmlFor="onboardingInterests"
            className="text-sm font-semibold text-primary"
          >
            Onboarding interests
          </label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enter one interest per line, in the order members should see them.
          </p>
          <Textarea
            id="onboardingInterests"
            required
            value={values.onboardingInterests}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                onboardingInterests: event.target.value,
              }))
            }
            className="mt-4 min-h-48 bg-background"
          />
        </div>
      </div>

      {error && <AdminError message={error} />}
      {success && <AdminSuccess message={success} />}

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="size-4" />
          {settings.updatedAt
            ? `Last updated ${formatAdminDateTime(settings.updatedAt)}`
            : "Using the programme defaults"}
        </p>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </div>
    </form>
  );
}

export function ProgrammeSettingsSection() {
  const settings = useQuery(api.programSettings.getForAdmin);

  if (settings === undefined) {
    return <AdminSectionLoading rows={4} />;
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Operating rules"
        title="Programme settings"
        description="Control matching limits and workflow timings. These settings are shared across the programme and can be updated by any administrator."
      />

      <Card>
        <CardHeader className="border-b pb-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="size-5 text-[#987721]" />
            Programme controls
          </CardTitle>
          <CardDescription>
            Changes take effect in server-side programme workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgrammeSettingsForm
            key={settings.updatedAt ?? "programme-defaults"}
            settings={settings}
          />
        </CardContent>
      </Card>
    </div>
  );
}

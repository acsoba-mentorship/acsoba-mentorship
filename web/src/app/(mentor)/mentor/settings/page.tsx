"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type MentorPrivacySettings = {
  masterIdentityDisclosure: boolean;
  overrides: {
    name: boolean;
    email: boolean;
    phoneNumber: boolean;
  };
};

const defaultSettings: MentorPrivacySettings = {
  masterIdentityDisclosure: true,
  overrides: {
    name: true,
    email: false,
    phoneNumber: false,
  },
};

const identityFields = [
  {
    key: "name",
    label: "Name",
    description: "Show your name in mentor search, profile pages, and request views.",
  },
  {
    key: "email",
    label: "Email",
    description: "Allow mentees to see your email when identity disclosure permits it.",
  },
  {
    key: "phoneNumber",
    label: "Phone number",
    description: "Allow mentees to see your phone number when identity disclosure permits it.",
  },
] as const;

export default function MentorSettingsPage() {
  const settings = useQuery(api.users.getMyMentorPrivacySettings, {});
  const updateSettings = useMutation(api.users.updateMyMentorPrivacySettings);
  const [draft, setDraft] = useState<MentorPrivacySettings>(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;

    setDraft({
      masterIdentityDisclosure: settings.masterIdentityDisclosure,
      overrides: {
        name: settings.overrides?.name ?? defaultSettings.overrides.name,
        email: settings.overrides?.email ?? defaultSettings.overrides.email,
        phoneNumber:
          settings.overrides?.phoneNumber ?? defaultSettings.overrides.phoneNumber,
      },
    });
    setIsDirty(false);
  }, [settings]);

  const updateDraft = (next: MentorPrivacySettings) => {
    setDraft(next);
    setIsDirty(true);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateSettings(draft);
      setIsDirty(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update mentor privacy settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentor Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Control which identity details are disclosed to mentees.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to save settings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <CardTitle>Identity Disclosure</CardTitle>
              <CardDescription>
                Public mentor information such as expertise and industries remains visible.
                Private identity fields follow these settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <Checkbox
              id="masterIdentityDisclosure"
              checked={draft.masterIdentityDisclosure}
              onCheckedChange={(checked) =>
                updateDraft({
                  ...draft,
                  masterIdentityDisclosure: checked === true,
                })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="masterIdentityDisclosure">
                Allow identity disclosure
              </Label>
              <p className="text-sm text-muted-foreground">
                When this is off, name, email, phone number, and username are hidden
                from mentees unless there is an accepted mentorship request.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {identityFields.map((field) => (
              <div
                key={field.key}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <Checkbox
                  id={`privacy-${field.key}`}
                  checked={draft.overrides[field.key]}
                  disabled={!draft.masterIdentityDisclosure}
                  onCheckedChange={(checked) =>
                    updateDraft({
                      ...draft,
                      overrides: {
                        ...draft.overrides,
                        [field.key]: checked === true,
                      },
                    })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor={`privacy-${field.key}`}>{field.label}</Label>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleSave()} disabled={!isDirty || isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

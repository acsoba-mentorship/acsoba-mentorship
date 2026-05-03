"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { aboutSchema, type AboutFormInput, type AboutFormValues } from "@/lib/validation/profile";
import type { PublicUserProfile } from "@/lib/types";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface AboutSectionFormProps {
  user: PublicUserProfile;
  onSuccess?: () => void;
}

type UsernameState = "idle" | "checking" | "invalid" | "taken" | "valid";

export function AboutSectionForm({ user, onSuccess }: AboutSectionFormProps) {
  const updateUserProfileBasics = useMutation(api.users.updateUserProfileBasics);
  const updateUsername = useMutation(api.users.updateUsername);
  const [nowBucketMs] = useState(() => Math.floor(Date.now() / 60_000) * 60_000);
  const usernameChangeStatus = useQuery(api.users.getUsernameChangeStatus, {
    nowMs: nowBucketMs,
  });

  const form = useForm<AboutFormInput, unknown, AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    mode: "onChange",
    defaultValues: {
      bio: user.bio ?? "",
      location: user.location ?? "",
      title: user.title ?? "",
      username: user.username,
    },
  });

  const watchedUsername = useWatch({ control: form.control, name: "username" });

  const normalizedUsername = (watchedUsername ?? "").trim().toLowerCase();
  const usernameChanged = normalizedUsername !== user.username;
  const usernameFormatValid = usernameChanged && !form.formState.errors.username;

  const usernameAvailability = useQuery(
    api.users.checkUsernameAvailable,
    usernameFormatValid ? { username: normalizedUsername } : "skip"
  );

  // Derive a single state that drives all username feedback and submit gating
  const usernameState: UsernameState = (() => {
    if (!usernameChanged) return "idle";
    if (!usernameFormatValid) return "invalid";
    if (usernameAvailability === undefined) return "checking";
    if (!usernameAvailability.available) return "taken";
    return "valid";
  })();

  if (usernameChangeStatus === undefined) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { canChangeUsername } = usernameChangeStatus;
  const cooldownMessage = "Username changes are currently unavailable.";

  const canSubmit =
    !form.formState.isSubmitting &&
    !form.formState.errors.username &&
    usernameState !== "checking" &&
    usernameState !== "taken" &&
    usernameState !== "invalid" &&
    (!usernameChanged || canChangeUsername);

  const onSubmit = async (values: AboutFormValues) => {
    if (values.username !== user.username) {
      if (!canChangeUsername) {
        form.setError("username", { type: "manual", message: cooldownMessage });
        return;
      }
      if (usernameState === "taken") {
        form.setError("username", { type: "manual", message: "Username is already taken." });
        return;
      }
    }

    await updateUserProfileBasics({
      bio: values.bio,
      location: values.location,
      title: values.title,
    });

    if (values.username !== user.username) {
      await updateUsername({ username: values.username });
    }
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                {canChangeUsername ? (
                  <Input
                    placeholder="e.g. john_doe"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    {...field}
                  />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block w-full cursor-not-allowed">
                          <Input
                            placeholder="e.g. john_doe"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            disabled
                            {...field}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{cooldownMessage}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </FormControl>
              {usernameState === "checking" && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Checking username…
                </p>
              )}
              {usernameState === "invalid" && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircle className="size-3.5" />
                  {form.formState.errors.username?.message ?? "Invalid username."}
                </p>
              )}
              {usernameState === "taken" && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <XCircle className="size-3.5" />
                  Username is already taken.
                </p>
              )}
              {usernameState === "valid" && (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="size-3.5" />
                  Username is available.
                </p>
              )}
              {usernameState === "idle" && <FormMessage />}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share a brief summary about yourself."
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional headline</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. San Francisco, CA" {...field} />
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
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

"use client";

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
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface AboutSectionFormProps {
  user: User;
  onSuccess?: () => void;
}

function normalizeUsername(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hasUsernameChanged(nextUsername: string, currentUsername: string): boolean {
  return nextUsername !== currentUsername;
}

function isUsernameTakenByAnotherUser(
  shouldCheck: boolean,
  existingUserId: string | null,
  currentUserId: string
): boolean {
  if (!shouldCheck || !existingUserId) return false;
  return existingUserId !== currentUserId;
}

export function AboutSectionForm({ user, onSuccess }: AboutSectionFormProps) {
  const updateUserProfileBasics = useMutation(api.users.updateUserProfileBasics);
  const updateUsername = useMutation(api.users.updateUsername);
  const usernameStatus = useQuery(api.users.getUsernameChangeStatus, {});
  const currentUsername = user.username;
  const currentUserId = String(user._id);

  const form = useForm<AboutFormInput, unknown, AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      bio: user.bio ?? "",
      location: user.location ?? "",
      title: user.title ?? "",
      username: currentUsername,
    },
  });

  const watchedUsername = useWatch({
    control: form.control,
    name: "username",
  });

  const normalizedUsername = normalizeUsername(watchedUsername);
  const isUsernameFormatValid = normalizedUsername.length > 0 && !form.formState.errors.username;
  const shouldCheckUsernameUniqueness = isUsernameFormatValid && hasUsernameChanged(normalizedUsername, currentUsername);

  const existingUserForUsername = useQuery(
    api.users.getUserByUsername,
    shouldCheckUsernameUniqueness ? { username: normalizedUsername } : "skip"
  );

  // Existing user ID for the username if FOUND
  const existingUserId = existingUserForUsername
    ? String(existingUserForUsername._id)
    : null;

  const isUsernameTaken = isUsernameTakenByAnotherUser(
    shouldCheckUsernameUniqueness,
    existingUserId,
    currentUserId
  );

  // Show loading state if username status is still loading
  const isUsernameStatusLoading = usernameStatus === undefined;
  if (isUsernameStatusLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canChangeUsername = usernameStatus.canChangeUsername;
  const cooldownMessage = "Username changes are currently unavailable.";
  const shouldChangeUsername = hasUsernameChanged(normalizedUsername, currentUsername);

  // Can be submitted if: there are no form errors, the username is not taken, and the username is not being changed (or if the username can be changed)
  const canSubmit =
    !form.formState.isSubmitting &&
    !form.formState.errors.username &&
    !isUsernameTaken &&
    (!shouldChangeUsername || canChangeUsername);

  const onSubmit = async (values: AboutFormValues) => {
    if (values.username !== currentUsername) {
      if (!canChangeUsername) {
        form.setError("username", {
          type: "manual",
          message: cooldownMessage,
        });
        return;
      }

      if (isUsernameTaken) {
        form.setError("username", {
          type: "manual",
          message: "Username is already taken.",
        });
        return;
      }
    }

    await updateUserProfileBasics({
      bio: values.bio,
      location: values.location,
      title: values.title,
    });

    if (values.username !== currentUsername) {
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
                    disabled={false}
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
              {isUsernameTaken && (
                <p className="text-sm text-destructive">Username is already taken.</p>
              )}
              <FormMessage />
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

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  educationEntrySchema,
  type EducationEntryFormInput,
  type EducationEntryFormValues,
  educationFormToEntry,
} from "@/lib/validation/profile";
import { fromTimestamp } from "@/lib/utils";
import { CURRENT_YEAR, MONTHS, YEAR_OPTIONS } from "@/lib/constants";

interface EducationFormProps {
  /** When provided, form is in edit mode and we call updateEducation(index, entry). */
  editIndex?: number;
  /** Called when user clicks Delete. Only shown in edit mode. */
  onDelete?: () => void;
  /** Pre-fill when editing. */
  initialEntry?: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate: number;
    endDate?: number;
    description?: string;
  };
  onSuccess?: () => void;
}

const defaultValues: EducationEntryFormValues = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startMonth: new Date().getMonth() + 1,
  startYear: CURRENT_YEAR,
  description: "",
};

export function EducationForm({
  editIndex,
  onDelete,
  initialEntry,
  onSuccess,
}: EducationFormProps) {
  const addEducation = useMutation(api.users.addEducation);
  const updateEducation = useMutation(api.users.updateEducation);

  const form = useForm<EducationEntryFormInput, unknown, EducationEntryFormValues>({
    resolver: zodResolver(educationEntrySchema),
    defaultValues: initialEntry
      ? {
          institution: initialEntry.institution,
          degree: initialEntry.degree ?? "",
          fieldOfStudy: initialEntry.fieldOfStudy ?? "",
          startMonth: fromTimestamp(initialEntry.startDate).month,
          startYear: fromTimestamp(initialEntry.startDate).year,
          endMonth: initialEntry.endDate != null ? fromTimestamp(initialEntry.endDate).month : undefined,
          endYear: initialEntry.endDate != null ? fromTimestamp(initialEntry.endDate).year : undefined,
          description: initialEntry.description ?? "",
        }
      : defaultValues,
  });

  const onSubmit = async (values: EducationEntryFormValues) => {
    const entry = educationFormToEntry(values);
    if (editIndex !== undefined) {
      await updateEducation({ index: editIndex, entry });
    } else {
      await addEducation({ entry });
    }
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School / Institution</FormLabel>
              <FormControl>
                <Input placeholder="e.g. National University of Singapore" {...field} />
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
              <FormLabel>Degree (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bachelor of Computing" {...field} />
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
              <FormLabel>Field of study (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Computer Science" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start month</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-52"
                  >
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
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-52"
                  >
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
          <FormField
            control={form.control}
            name="endMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End month (optional)</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(parseInt(v, 10));
                    void form.trigger(["endMonth", "endYear"]);
                  }}
                  value={field.value ? String(field.value) : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Present" />
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
            name="endYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End year (optional)</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(parseInt(v, 10));
                    void form.trigger(["endMonth", "endYear"]);
                  }}
                  value={field.value ? String(field.value) : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Present" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-52"
                  >
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Coursework, activities, achievements..."
                  className="min-h-20 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

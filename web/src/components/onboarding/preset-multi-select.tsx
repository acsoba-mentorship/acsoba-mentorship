"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_TAG_MAX,
  ONBOARDING_TAG_MIN,
} from "@/lib/onboarding/constants";

type PresetMultiSelectProps = {
  title: string;
  description?: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

export function PresetMultiSelect({
  title,
  description,
  options,
  value,
  onChange,
  error,
}: PresetMultiSelectProps) {
  const atMax = value.length >= ONBOARDING_TAG_MAX;

  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (atMax) return;
    onChange([...value, option]);
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Choose {ONBOARDING_TAG_MIN}–{ONBOARDING_TAG_MAX} options
        </p>
      </div>
      <div className="rounded-xl border bg-card p-2">
        {options.map((option) => {
          const checked = value.includes(option);
          const disabled = !checked && atMax;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors",
                checked && "bg-muted/60",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => toggle(option)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium leading-snug">{option}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

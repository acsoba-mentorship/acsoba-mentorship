"use client";

import { cn } from "@/lib/utils";

type ChoiceOption = {
  value: string;
  label: string;
};

type ChoiceButtonsProps = {
  options: readonly ChoiceOption[];
  value: string | undefined;
  onChange: (value: string) => void;
};

export function ChoiceButtons({ options, value, onChange }: ChoiceButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-6 py-4 text-center text-base font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 text-foreground hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

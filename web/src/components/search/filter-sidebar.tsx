"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export interface SearchFilters {
  expertise: string[];
  availability: string[];
}

const expertiseOptions = [
  "Machine Learning",
  "Full Stack",
  "Data Science",
  "Cloud / DevOps",
  "UX Design",
  "Leadership",
];

const availabilityOptions = ["Available", "Unavailable"];

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2.5">
        {options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <Checkbox
              id={`${title}-${option}`}
              checked={selected.includes(option)}
              onCheckedChange={() => onToggle(option)}
            />
            <Label
              htmlFor={`${title}-${option}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const toggleFilter = (key: keyof SearchFilters, value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const activeCount = filters.expertise.length + filters.availability.length;

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Filters</h2>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() =>
                onFiltersChange({ expertise: [], availability: [] })
              }
            >
              Clear all
            </Button>
          )}
        </div>
        <Separator />
        <FilterGroup
          title="Expertise"
          options={expertiseOptions}
          selected={filters.expertise}
          onToggle={(v) => toggleFilter("expertise", v)}
        />
        <Separator />
        <FilterGroup
          title="Availability"
          options={availabilityOptions}
          selected={filters.availability}
          onToggle={(v) => toggleFilter("availability", v)}
        />
      </div>
    </aside>
  );
}

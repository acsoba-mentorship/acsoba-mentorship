"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sanitizeId } from "@/lib/utils";

export interface SearchFilters {
  ageGroups: string[];
  industries: string[];
  companies: string[];
  locations: string[];
  expertise: string[];
  availability: string[];
}

export interface SearchFilterOptions {
  ageGroups: string[];
  industries: string[];
  companies: string[];
  locations: string[];
  expertise: string[];
  availability: string[];
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  ageGroups: [],
  industries: [],
  companies: [],
  locations: [],
  expertise: [],
  availability: [],
};

interface FilterSidebarProps {
  filters: SearchFilters;
  options: SearchFilterOptions;
  onFiltersChange: (filters: SearchFilters) => void;
}

type FilterKey = keyof SearchFilters;

const FILTER_GROUPS: Array<{
  key: FilterKey;
  title: string;
  emptyLabel: string;
}> = [
  {
    key: "ageGroups",
    title: "Age group",
    emptyLabel: "No age groups available",
  },
  {
    key: "industries",
    title: "Industry",
    emptyLabel: "No industries available",
  },
  {
    key: "companies",
    title: "Company",
    emptyLabel: "No companies available",
  },
  {
    key: "locations",
    title: "Geography",
    emptyLabel: "No locations available",
  },
  {
    key: "expertise",
    title: "Expertise",
    emptyLabel: "No expertise available",
  },
  {
    key: "availability",
    title: "Availability",
    emptyLabel: "No availability options",
  },
];

function FilterGroup({
  idPrefix,
  title,
  emptyLabel,
  options,
  selected,
  onToggle,
}: {
  idPrefix: string;
  title: string;
  emptyLabel: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const visibleOptions = Array.from(new Set([...options, ...selected]));

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>

      {visibleOptions.length > 0 ? (
        <div className="space-y-2.5">
          {visibleOptions.map((option) => {
            const id = sanitizeId(`${idPrefix}-${title}-${option}`);

            return (
              <div key={option} className="flex items-start gap-2">
                <Checkbox
                  id={id}
                  checked={selected.includes(option)}
                  onCheckedChange={() => onToggle(option)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={id}
                  className="cursor-pointer text-sm font-normal leading-5"
                >
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function FilterPanel({
  idPrefix,
  filters,
  options,
  activeCount,
  onToggle,
  onClear,
}: {
  idPrefix: string;
  filters: SearchFilters;
  options: SearchFilterOptions;
  activeCount: number;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Filters</h2>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="border-0 bg-secondary text-secondary-foreground"
            >
              {activeCount}
            </Badge>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs text-primary"
            onClick={onClear}
          >
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {FILTER_GROUPS.map((group, index) => (
        <div key={group.key}>
          {index > 0 && <Separator className="mb-5" />}
          <FilterGroup
            idPrefix={idPrefix}
            title={group.title}
            emptyLabel={group.emptyLabel}
            options={options[group.key]}
            selected={filters[group.key]}
            onToggle={(value) => onToggle(group.key, value)}
          />
        </div>
      ))}
    </div>
  );
}

export function FilterSidebar({
  filters,
  options,
  onFiltersChange,
}: FilterSidebarProps) {
  const toggleFilter = (key: FilterKey, value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    onFiltersChange({ ...filters, [key]: updated });
  };

  const clearFilters = () => {
    onFiltersChange({ ...EMPTY_SEARCH_FILTERS });
  };

  const activeCount = Object.values(filters).reduce(
    (count, values) => count + values.length,
    0
  );

  return (
    <>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between bg-card"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filter mentors
              </span>

              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="border-0 bg-secondary text-secondary-foreground"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[min(90vw,24rem)] overflow-y-auto sm:max-w-sm"
          >
            <SheetHeader>
              <SheetTitle>Filter mentors</SheetTitle>
              <SheetDescription>
                Narrow results by profile, experience, and availability.
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              <FilterPanel
                idPrefix="mobile-mentor-filter"
                filters={filters}
                options={options}
                activeCount={activeCount}
                onToggle={toggleFilter}
                onClear={clearFilters}
              />

              <SheetClose asChild>
                <Button type="button" className="mt-6 w-full">
                  Show results
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl bg-card p-4">
          <FilterPanel
            idPrefix="desktop-mentor-filter"
            filters={filters}
            options={options}
            activeCount={activeCount}
            onToggle={toggleFilter}
            onClear={clearFilters}
          />
        </div>
      </aside>
    </>
  );
}

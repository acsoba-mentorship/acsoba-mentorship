"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FilterCheckboxGroup } from "./filter-checkbox-group";
import {
  expertiseOptions,
  experienceLevelOptions,
  availabilityOptions,
} from "@/lib/dummy-data";
import { X } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    expertise: string[];
    experienceLevel: string[];
    availability: string[];
  };
  onFiltersChange: (filters: {
    expertise: string[];
    experienceLevel: string[];
    availability: string[];
  }) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const hasActiveFilters =
    filters.expertise.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.availability.length > 0;

  const clearAllFilters = () => {
    onFiltersChange({
      expertise: [],
      experienceLevel: [],
      availability: [],
    });
  };

  return (
    <div className="w-64 shrink-0 space-y-6 rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      <FilterCheckboxGroup
        title="Expertise"
        options={expertiseOptions}
        selectedValues={filters.expertise}
        onSelectionChange={(values) =>
          onFiltersChange({ ...filters, expertise: values })
        }
      />

      <Separator />

      <FilterCheckboxGroup
        title="Experience Level"
        options={experienceLevelOptions}
        selectedValues={filters.experienceLevel}
        onSelectionChange={(values) =>
          onFiltersChange({ ...filters, experienceLevel: values })
        }
      />

      <Separator />

      <FilterCheckboxGroup
        title="Availability"
        options={availabilityOptions}
        selectedValues={filters.availability}
        onSelectionChange={(values) =>
          onFiltersChange({ ...filters, availability: values })
        }
      />
    </div>
  );
}

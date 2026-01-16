"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FilterOption } from "@/lib/types";

interface FilterCheckboxGroupProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export function FilterCheckboxGroup({
  title,
  options,
  selectedValues,
  onSelectionChange,
}: FilterCheckboxGroupProps) {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, value]);
    } else {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={option.id}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(option.value, checked === true)
              }
            />
            <label
              htmlFor={option.id}
              className="text-sm leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-md border">
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        className="rounded-r-none"
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        className="rounded-l-none"
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}

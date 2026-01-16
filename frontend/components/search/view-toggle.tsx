"use client";

import { Button } from "@/components/ui/button";
import { ViewMode } from "@/lib/types";
import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className="h-8 px-3"
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className="h-8 px-3"
      >
        <List className="mr-2 h-4 w-4" />
        List
      </Button>
    </div>
  );
}

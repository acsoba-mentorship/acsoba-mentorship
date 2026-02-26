"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSidebar, type SearchFilters } from "@/components/search/filter-sidebar";
import { ViewToggle } from "@/components/search/view-toggle";
import { MentorCard } from "@/components/search/mentor-card";
import { MentorListItem } from "@/components/search/mentor-list-item";
import { mockMentors } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/types";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    expertise: [],
    availability: [],
  });

  const filteredMentors = useMemo(() => {
    return mockMentors.filter((mentor) => {
      const profile = mentor.mentorProfile;
      if (!profile) return false;

      if (query) {
        const q = query.toLowerCase();
        const searchable = [
          mentor.name,
          mentor.title,
          mentor.bio,
          ...profile.expertise,
          ...profile.industries,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (filters.expertise.length > 0) {
        const mentorSkills = profile.expertise.map((s) => s.toLowerCase());
        const hasMatch = filters.expertise.some((f) =>
          mentorSkills.some((s) => s.includes(f.toLowerCase()))
        );
        if (!hasMatch) return false;
      }

      if (filters.availability.length > 0) {
        const isAvailable = profile.isAvailable;
        const wantsAvailable = filters.availability.includes("Available");
        const wantsUnavailable = filters.availability.includes("Unavailable");
        if (wantsAvailable && !wantsUnavailable && !isAvailable) return false;
        if (wantsUnavailable && !wantsAvailable && isAvailable) return false;
      }

      return true;
    });
  }, [query, filters]);

  const activeFilterCount =
    filters.expertise.length + filters.availability.length;

  const clearAll = () => {
    setQuery("");
    setFilters({ expertise: [], availability: [] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Mentors</h1>
        <p className="mt-1 text-muted-foreground">
          Search for mentors based on expertise, experience, and availability.
        </p>
      </div>

      <div className="flex gap-6">
        <FilterSidebar filters={filters} onFiltersChange={setFilters} />

        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-1 items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          {/* Results */}
          {filteredMentors.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <MentorListItem key={mentor.id} mentor={mentor} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Search className="size-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No mentors found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
              <Button variant="outline" className="mt-4" onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { ViewToggle } from "@/components/search/view-toggle";
import { MentorCard } from "@/components/search/mentor-card";
import { MentorListItem } from "@/components/search/mentor-list-item";
import { getMentorsWithUsers, filterMentors } from "@/lib/dummy-data";
import { ViewMode } from "@/lib/types";
import { Search } from "lucide-react";

export default function MenteeSearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState({
    expertise: [] as string[],
    experienceLevel: [] as string[],
    availability: [] as string[],
  });

  const allMentors = getMentorsWithUsers();
  const filteredMentors = filterMentors(allMentors, filters);

  const activeFilterCount =
    filters.expertise.length +
    filters.experienceLevel.length +
    filters.availability.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Mentors</h1>
        <p className="mt-1 text-muted-foreground">
          Search for mentors based on expertise, experience, and availability
        </p>
      </div>

      <div className="flex gap-6">
        <FilterSidebar filters={filters} onFiltersChange={setFilters} />

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredMentors.length} mentor{filteredMentors.length !== 1 && "s"} found
                {activeFilterCount > 0 && (
                  <span className="ml-1">
                    ({activeFilterCount} filter{activeFilterCount !== 1 && "s"} applied)
                  </span>
                )}
              </span>
            </div>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          {filteredMentors.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMentors.map((mentor) => (
                  <MentorCard
                    key={mentor.userId}
                    mentor={mentor}
                    onSendRequest={() => {
                      // Future: Open request modal
                      alert(`Request sent to ${mentor.user.firstName} ${mentor.user.lastName}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <MentorListItem
                    key={mentor.userId}
                    mentor={mentor}
                    onSendRequest={() => {
                      // Future: Open request modal
                      alert(`Request sent to ${mentor.user.firstName} ${mentor.user.lastName}`);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Search className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No mentors found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters to find more mentors
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  setFilters({
                    expertise: [],
                    experienceLevel: [],
                    availability: [],
                  })
                }
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

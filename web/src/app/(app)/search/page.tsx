"use client";

import { useState, useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSidebar, type SearchFilters } from "@/components/search/filter-sidebar";
import { ViewToggle } from "@/components/search/view-toggle";
import { MentorCard } from "@/components/search/mentor-card";
import { MentorListItem } from "@/components/search/mentor-list-item";
import { useLatestRequestStatusByMentor } from "@/hooks/use-latest-request-status-by-mentor";
import { api } from "../../../../convex/_generated/api";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import type { ViewMode } from "@/lib/types";
import { Search } from "lucide-react";

export default function SearchPage() {
  const { currentUserId, hasMenteeProfile, getLatestStatus, latestRequestStatusLoading } =
    useLatestRequestStatusByMentor();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    expertise: [],
    availability: [],
  });

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const mentors = useQuery(api.users.listMentors, isAuthenticated ? { limit: 50 } : "skip");
  const mentorsLoading = authLoading || (isAuthenticated && mentors === undefined);

  const filteredMentors = useMemo(() => {
    return (mentors ?? []).filter((mentor) => {
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
        const lowercasedFilters = filters.expertise.map((f) => f.toLowerCase());
        const hasMatch = lowercasedFilters.some((f) =>
          mentorSkills.some((s) => s.includes(f))
        );
        if (!hasMatch) return false;
      }

      if (filters.availability.length > 0) {
        const isAvailable = profile.isAvailable;
        const wantsAvailable = filters.availability.includes(AVAILABLE);
        const wantsUnavailable = filters.availability.includes(UNAVAILABLE);
        if (wantsAvailable && !wantsUnavailable && !isAvailable) return false;
        if (wantsUnavailable && !wantsAvailable && isAvailable) return false;
      }

      return true;
    });
  }, [query, filters, mentors]);

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
                className="pl-9 bg-muted/30 border-0 focus-visible:ring-primary/30"
              />
            </div>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          {/* Results */}
          {mentorsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : filteredMentors.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMentors.map((mentor) => (
                  <MentorCard
                    key={mentor.mentorId}
                    mentor={mentor}
                    currentUserId={currentUserId}
                    hasMenteeProfile={hasMenteeProfile}
                    latestRequestStatus={getLatestStatus(mentor.mentorId)}
                    latestRequestStatusLoading={latestRequestStatusLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <MentorListItem
                    key={mentor.mentorId}
                    mentor={mentor}
                    currentUserId={currentUserId}
                    hasMenteeProfile={hasMenteeProfile}
                    latestRequestStatus={getLatestStatus(mentor.mentorId)}
                    latestRequestStatusLoading={latestRequestStatusLoading}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 py-12">
              <Search className="size-12 text-primary/20" />
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

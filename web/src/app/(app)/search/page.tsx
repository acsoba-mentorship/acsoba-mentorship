"use client";

import { useState, useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EMPTY_SEARCH_FILTERS,
  FilterSidebar,
  type SearchFilterOptions,
  type SearchFilters,
} from "@/components/search/filter-sidebar";
import { ViewToggle } from "@/components/search/view-toggle";
import { MentorCard } from "@/components/search/mentor-card";
import { MentorListItem } from "@/components/search/mentor-list-item";
import { useLatestRequestStatusByMentor } from "@/hooks/use-latest-request-status-by-mentor";
import { api } from "../../../../convex/_generated/api";
import {
  AVAILABILITY_FILTER_OPTIONS,
  AVAILABLE,
  UNAVAILABLE,
} from "@/lib/constants";
import type { PublicMentorProfile, ViewMode } from "@/lib/types";
import { Search } from "lucide-react";

function uniqueSortedOptions(values: Array<string | null | undefined>) {
  const optionsByKey = new Map<string, string>();

  values.forEach((value) => {
    const label = value?.trim();
    if (!label) return;

    const key = label.toLocaleLowerCase();
    if (!optionsByKey.has(key)) {
      optionsByKey.set(key, label);
    }
  });

  return [...optionsByKey.values()].sort((a, b) => a.localeCompare(b));
}

function matchesSelectedOptions(selected: string[], mentorValues: string[]) {
  if (selected.length === 0) {
    return true;
  }

  const normalizedMentorValues = new Set(
    mentorValues.map((value) => value.trim().toLocaleLowerCase())
  );

  return selected.some((value) =>
    normalizedMentorValues.has(value.trim().toLocaleLowerCase())
  );
}

export default function SearchPage() {
  const { currentUserId, hasMenteeProfile, getLatestStatus, latestRequestStatusLoading } =
    useLatestRequestStatusByMentor();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...EMPTY_SEARCH_FILTERS,
  }));

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const mentors = useQuery(
    api.users.listMentors,
    isAuthenticated ? {} : "skip"
  );
  const mentorsLoading = authLoading || (isAuthenticated && mentors === undefined);

  const mentorResults = useMemo(
    () => (mentors ?? []) as PublicMentorProfile[],
    [mentors]
  );

  const filterOptions = useMemo<SearchFilterOptions>(
    () => ({
      ageGroups: uniqueSortedOptions(
        mentorResults.map((mentor) => mentor.ageGroup)
      ),
      industries: uniqueSortedOptions(
        mentorResults.flatMap((mentor) => mentor.industries)
      ),
      companies: uniqueSortedOptions(
        mentorResults.map((mentor) => mentor.company)
      ),
      locations: uniqueSortedOptions(
        mentorResults.map((mentor) => mentor.location)
      ),
      expertise: uniqueSortedOptions(
        mentorResults.flatMap(
          (mentor) => mentor.mentorProfile?.expertise ?? []
        )
      ),
      availability: [...AVAILABILITY_FILTER_OPTIONS],
    }),
    [mentorResults]
  );

  const filteredMentors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return mentorResults
      .filter((mentor) => {
        const profile = mentor.mentorProfile;
        if (!profile) return false;

        if (normalizedQuery) {
          const searchable = [
            mentor.name,
            mentor.title,
            mentor.bio,
            mentor.ageGroup,
            mentor.company,
            mentor.location,
            ...profile.expertise,
            ...mentor.industries,
            ...(mentor.matchedInterests ?? []),
            ...(mentor.badges ?? []),
          ]
            .join(" ")
            .toLocaleLowerCase();

          if (!searchable.includes(normalizedQuery)) return false;
        }

        if (!matchesSelectedOptions(filters.ageGroups, [mentor.ageGroup])) {
          return false;
        }

        if (!matchesSelectedOptions(filters.industries, mentor.industries)) {
          return false;
        }

        if (!matchesSelectedOptions(filters.companies, [mentor.company])) {
          return false;
        }

        if (!matchesSelectedOptions(filters.locations, [mentor.location])) {
          return false;
        }

        if (!matchesSelectedOptions(filters.expertise, profile.expertise)) {
          return false;
        }

        if (filters.availability.length > 0) {
          const isAvailable = profile.isAvailable;
          const wantsAvailable = filters.availability.includes(AVAILABLE);
          const wantsUnavailable = filters.availability.includes(UNAVAILABLE);
          if (wantsAvailable && !wantsUnavailable && !isAvailable) return false;
          if (wantsUnavailable && !wantsAvailable && isAvailable) return false;
        }

        return true;
      })
      .sort(
        (first, second) =>
          (second.matchScore ?? 0) - (first.matchScore ?? 0) ||
          Number(second.mentorProfile?.isAvailable ?? false) -
            Number(first.mentorProfile?.isAvailable ?? false)
      );
  }, [filters, mentorResults, query]);

  const clearAll = () => {
    setQuery("");
    setFilters({ ...EMPTY_SEARCH_FILTERS });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Mentors</h1>
        <p className="mt-1 text-muted-foreground">
          Search for mentors based on expertise, experience, and availability.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <FilterSidebar
          filters={filters}
          options={filterOptions}
          onFiltersChange={setFilters}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by mentor, company, skill, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 bg-muted/30 pl-9 focus-visible:ring-primary/30"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              {!mentorsLoading && (
                <p className="whitespace-nowrap text-sm text-muted-foreground">
                  {filteredMentors.length} mentor
                  {filteredMentors.length === 1 ? "" : "s"}
                </p>
              )}
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
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

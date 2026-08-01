"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Briefcase, Search } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

type OpenInternship =
  FunctionReturnType<typeof api.internships.listOpen>[number];

type PayFilter = "all" | "paid" | "unpaid";

/**
 * FR17: browse card intentionally omits the description on the /internships
 * list view — the four rows below (title, company, pay/duration, dates +
 * action) are all that's shown here. The full description lives on the
 * details page.
 */
function InternshipCard({ internship }: { internship: OpenInternship }) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-0 pb-3">
        {/* Row 1: role title */}
        <CardTitle className="line-clamp-1 text-base">
          {internship.role}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-2.5">
        {/* Row 2: company + offeror */}
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {internship.companyName} · Offered by {internship.offerorName}
        </p>

        {/* Row 3: paid/unpaid + duration */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={internship.isPaid ? "default" : "outline"}>
            {internship.isPaid ? "Paid" : "Unpaid"}
          </Badge>
          <span>Duration: {internship.duration}</span>
        </div>

        {/* Row 4: closing date + status/action */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            <span>Closes {formatDate(internship.closingDate)}</span>
            {internship.isMine ? (
              <Badge variant="secondary" className="ml-2">
                Your posting
              </Badge>
            ) : internship.alreadyExpressedInterest ? (
              <Badge variant="secondary" className="ml-2">
                Applied
              </Badge>
            ) : null}
          </div>
          <Button asChild type="button" size="sm">
            <Link href={`/internships/${internship._id}`}>
              View details
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function matchesSearch(internship: OpenInternship, query: string) {
  if (!query) return true;
  const haystack = [
    internship.role,
    internship.companyName,
    internship.offerorName,
    internship.duration,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function BrowseInternships() {
  const internships = useQuery(api.internships.listOpen, {});
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<PayFilter>("all");

  const filtered = useMemo(() => {
    if (!internships) return undefined;
    return internships.filter((internship) => {
      if (payFilter === "paid" && !internship.isPaid) return false;
      if (payFilter === "unpaid" && internship.isPaid) return false;
      return matchesSearch(internship, search.trim());
    });
  }, [internships, search, payFilter]);

  if (internships === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or company..."
            className="pl-9"
            aria-label="Search internships by title or company"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by pay"
          className="inline-flex w-fit items-center rounded-md border p-0.5"
        >
          {(
            [
              { value: "all", label: "All" },
              { value: "paid", label: "Paid" },
              { value: "unpaid", label: "Unpaid" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPayFilter(option.value)}
              aria-pressed={payFilter === option.value}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                payFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {internships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Briefcase className="size-5" />
            </span>
            <p className="mt-4 font-semibold">No open internships right now</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Check back soon, or offer one yourself if you know of an
              opportunity.
            </p>
          </CardContent>
        </Card>
      ) : filtered && filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Search className="size-5" />
            </span>
            <p className="mt-4 font-semibold">No matching internships</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try a different search term or clear the pay filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((internship) => (
            <InternshipCard key={internship._id} internship={internship} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Briefcase, Building2, CalendarClock, Search } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

type OpenInternship =
  FunctionReturnType<typeof api.internships.listOpen>[number];

type PayFilter = "all" | "paid" | "unpaid";

/**
 * FR17: browse card intentionally omits the description on the /internships
 * list view — the details shown here are enough to decide whether to open
 * the posting. The full description lives on the details page. Styled to
 * match the mentor search card (icon header, status badges, footer action).
 */
function InternshipCard({ internship }: { internship: OpenInternship }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-start gap-3 overflow-hidden">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="size-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {internship.role}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {internship.companyName}
            </CardDescription>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge
              className={
                internship.isPaid
                  ? "border-0 bg-emerald-50 text-emerald-700"
                  : "border-0 bg-muted text-muted-foreground"
              }
            >
              {internship.isPaid ? "Paid" : "Unpaid"}
            </Badge>
            {internship.isMine ? (
              <Badge variant="secondary">Your posting</Badge>
            ) : internship.alreadyExpressedInterest ? (
              <Badge variant="secondary">Applied</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="line-clamp-1 text-sm text-muted-foreground">
          Offered by {internship.offerorName}
        </p>

        <div className="mt-auto grid gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">Duration: {internship.duration}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5 shrink-0" />
            Closes {formatDate(internship.closingDate)}
          </span>
        </div>

        <Button asChild type="button" size="sm" className="mt-2 w-full">
          <Link href={`/internships/${internship._id}`}>View details</Link>
        </Button>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered?.map((internship) => (
            <InternshipCard key={internship._id} internship={internship} />
          ))}
        </div>
      )}
    </div>
  );
}

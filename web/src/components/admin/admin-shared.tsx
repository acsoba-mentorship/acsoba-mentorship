import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Download, Inbox, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function formatAdminDate(
  timestamp: number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
) {
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    ...options,
  }).format(new Date(timestamp));
}

export function formatAdminDateTime(timestamp: number | null | undefined) {
  return formatAdminDate(timestamp, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminLabel(value: string) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-[#886c24] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function AdminSectionLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <Card>
        <CardContent className="space-y-3 pt-1">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 font-semibold text-primary">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function AdminError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>Unable to complete that action</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function AdminSuccess({ message }: { message: string }) {
  return (
    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
      <CheckCircle2 className="text-emerald-700" />
      <AlertTitle>Saved</AlertTitle>
      <AlertDescription className="text-emerald-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}

type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const statusClasses: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  danger: "border-red-200 bg-red-50 text-red-800",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(statusClasses[tone], "font-semibold", className)}
    >
      {children}
    </Badge>
  );
}

export function AdminRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold text-primary"
      aria-label={`${value} out of 5`}
    >
      {value}
      <span className="text-[#9d7a24]">/5</span>
    </span>
  );
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function slugifyForFilename(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "response"
  );
}

/**
 * Builds a plain-text file from a set of labelled fields, e.g. the full
 * detail of a pulse response, incident report, or exit feedback entry, so
 * admins have an offline record of it.
 */
export function buildResponseFileContents(
  title: string,
  fields: Array<[label: string, value: string | number | null | undefined]>
) {
  const lines = [title, "=".repeat(title.length), ""];
  for (const [label, value] of fields) {
    lines.push(`${label}:`);
    lines.push(
      value === null || value === undefined || value === ""
        ? "—"
        : String(value)
    );
    lines.push("");
  }
  return lines.join("\n");
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * FR: admins should be able to download the file detailing a pulse
 * response, incident review, or exit feedback entry. Since these
 * responses are structured text rather than uploaded files, this renders
 * them into a downloadable plain-text record.
 */
export function DownloadResponseButton({
  filenamePrefix,
  title,
  fields,
}: {
  filenamePrefix: string;
  title: string;
  fields: Array<[label: string, value: string | number | null | undefined]>;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        downloadTextFile(
          `${slugifyForFilename(filenamePrefix)}.txt`,
          buildResponseFileContents(title, fields)
        )
      }
    >
      <Download />
      Download
    </Button>
  );
}

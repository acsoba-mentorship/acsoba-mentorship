"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  CalendarDays,
  Loader2,
  LockKeyhole,
  Mail,
  Save,
  ShieldAlert,
  Siren,
  UserRound,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  AdminSuccess,
  DownloadAllResponsesButton,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminLabel,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type IncidentReport =
  FunctionReturnType<typeof api.incidentReports.listForAdmin>[number];
type IncidentStatus = IncidentReport["status"];
type IncidentFilter = IncidentStatus | "all";

const filters: Array<{ value: IncidentFilter; label: string }> = [
  { value: "all", label: "All reports" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const statuses: Array<{ value: IncidentStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

function severityTone(severity: IncidentReport["severity"]) {
  if (severity === "urgent" || severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "neutral" as const;
}

function statusTone(status: IncidentStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "dismissed") return "neutral" as const;
  if (status === "in_review") return "info" as const;
  return "warning" as const;
}

function IncidentCard({ report }: { report: IncidentReport }) {
  const updateReport = useMutation(api.incidentReports.updateForAdmin);
  const [status, setStatus] = useState<IncidentStatus>(report.status);
  const [notes, setNotes] = useState(report.adminNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateReport({
        reportId: report._id,
        status,
        adminNotes: notes.trim() || undefined,
      });
      setSuccess("Incident status and administrator notes were updated.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-primary/10 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge tone={severityTone(report.severity)}>
                {formatAdminLabel(report.severity)} severity
              </AdminStatusBadge>
              <AdminStatusBadge tone={statusTone(report.status)}>
                {formatAdminLabel(report.status)}
              </AdminStatusBadge>
            </div>
            <CardTitle className="mt-3 text-lg text-primary">
              {formatAdminLabel(report.category)} report
            </CardTitle>
            <CardDescription className="mt-1">
              Submitted {formatAdminDateTime(report.createdAt)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-lg bg-[#f7f6f2] px-4 py-3 text-sm">
              <p className="font-semibold text-primary">{report.reporterName}</p>
              <p className="text-xs text-muted-foreground">
                {report.reporterRole
                  ? `${formatAdminLabel(report.reporterRole)} reporter`
                  : "Reporter"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Reported person</p>
              <p className="font-medium">
                {report.reportedUserName || "Not linked to a user"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Incident date</p>
              <p className="font-medium">
                {formatAdminDate(report.occurredAt ?? report.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contact permission</p>
              <p className="font-medium">
                {report.allowContact
                  ? report.reporterEmail || "Allowed"
                  : "Contact not permitted"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resolution</p>
              <p className="font-medium">
                {report.resolvedAt
                  ? formatAdminDate(report.resolvedAt)
                  : "Not resolved"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-red-900 uppercase">
            <LockKeyhole className="size-4" />
            Confidential incident detail
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-950">
            {report.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-5">
          <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
            <div>
              <label
                htmlFor={`status-${report._id}`}
                className="text-sm font-semibold"
              >
                Case status
              </label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as IncidentStatus)}
              >
                <SelectTrigger
                  id={`status-${report._id}`}
                  className="mt-2 w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor={`notes-${report._id}`}
                className="text-sm font-semibold"
              >
                Administrator notes
              </label>
              <Textarea
                id={`notes-${report._id}`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={3000}
                rows={4}
                className="mt-2 min-h-28 bg-background"
                placeholder="Record follow-up, decisions, or the next action for the admin team."
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {notes.length}/3000
              </p>
            </div>
          </div>

          {error && <AdminError message={error} />}
          {success && <AdminSuccess message={success} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Save case update
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function IncidentReviewSection() {
  const [filter, setFilter] = useState<IncidentFilter>("all");
  const reports = useQuery(api.incidentReports.listForAdmin, {
    status: filter === "all" ? undefined : filter,
  });

  if (reports === undefined) {
    return <AdminSectionLoading rows={5} />;
  }

  const openCount = reports.filter(
    (report) => report.status === "open" || report.status === "in_review"
  ).length;

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Safety and support"
        title="Incident review"
        description="Review confidential reports, coordinate follow-up, and keep the reporter informed through controlled status updates."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={openCount > 0 ? "danger" : "success"}>
              {openCount} active case{openCount === 1 ? "" : "s"}
            </AdminStatusBadge>
            <DownloadAllResponsesButton
              filenamePrefix="incident-reports"
              headers={[
                "Category",
                "Severity",
                "Status",
                "Reporter",
                "Reporter role",
                "Reported person",
                "Incident date",
                "Contact permitted",
                "Reporter email",
                "Description",
                "Administrator notes",
                "Submitted",
                "Resolved",
              ]}
              rows={reports.map((report) => [
                formatAdminLabel(report.category),
                formatAdminLabel(report.severity),
                formatAdminLabel(report.status),
                report.reporterName,
                report.reporterRole ? formatAdminLabel(report.reporterRole) : null,
                report.reportedUserName,
                formatAdminDate(report.occurredAt ?? report.createdAt),
                report.allowContact ? "Yes" : "No",
                report.allowContact ? report.reporterEmail : null,
                report.description,
                report.adminNotes,
                formatAdminDateTime(report.createdAt),
                report.resolvedAt ? formatAdminDate(report.resolvedAt) : null,
              ])}
            />
          </div>
        }
      />

      <div
        className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-2"
        role="group"
        aria-label="Filter incident reports"
      >
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={Siren}
            title="No incident reports in this view"
            description="Choose another status filter or return later when a report is submitted."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <IncidentCard
              key={`${report._id}-${report.updatedAt}`}
              report={report}
            />
          ))}
        </div>
      )}
    </div>
  );
}

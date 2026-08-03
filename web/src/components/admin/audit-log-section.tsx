"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Eye, ScrollText, Search } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  formatAdminDateTime,
  formatAdminLabel,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditLogEntry = FunctionReturnType<typeof api.admin.listAuditLog>[number];

function actionTone(action: string) {
  if (action.includes("revoked")) return "danger" as const;
  if (action.includes("bootstrapped") || action.includes("claimed")) {
    return "success" as const;
  }
  if (action.includes("updated")) return "info" as const;
  return "neutral" as const;
}

/**
 * FR: "if the account is suspended/internship taken down/incident review
 * note, there should be more details regarding what note is taken, which
 * internship is taken down and why, which account is suspended and why."
 * Turns the raw log row into a readable list of detail lines specific to
 * the kind of event that happened.
 */
function buildDetailLines(log: AuditLogEntry): Array<[string, string]> {
  const lines: Array<[string, string]> = [
    ["Administrator", log.actorName],
    ["Event", formatAdminLabel(log.action)],
    ["When", formatAdminDateTime(log.createdAt)],
  ];

  const metadata = (log.metadata ?? {}) as Record<string, unknown>;

  if (log.action === "user.suspended" || log.action === "user.reactivated") {
    lines.push(["Account", log.targetEmail ?? "Unknown user"]);
    if (log.reason) lines.push(["Reason for suspension", log.reason]);
  } else if (log.action === "internship.taken_down") {
    lines.push(["Internship", String(metadata.role ?? log.targetId ?? "Unknown internship")]);
    lines.push(["Reason for takedown", log.reason ?? "No reason provided"]);
  } else if (log.action === "incident_report.updated") {
    if (metadata.fromStatus || metadata.toStatus) {
      lines.push([
        "Status change",
        `${formatAdminLabel(String(metadata.fromStatus ?? "unknown"))} → ${formatAdminLabel(String(metadata.toStatus ?? "unknown"))}`,
      ]);
    }
    lines.push([
      "Note taken",
      metadata.adminNotes ? String(metadata.adminNotes) : "No note recorded",
    ]);
  } else {
    if (log.targetType) lines.push(["Target type", formatAdminLabel(log.targetType)]);
    if (log.targetEmail) lines.push(["Target", log.targetEmail]);
    if (log.reason) lines.push(["Reason", log.reason]);
    for (const [key, value] of Object.entries(metadata)) {
      lines.push([formatAdminLabel(key), String(value)]);
    }
  }

  return lines;
}

function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>
            Full detail recorded for this administration event.
          </DialogDescription>
        </DialogHeader>
        {log && (
          <dl className="space-y-3 text-sm">
            {buildDetailLines(log).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap leading-6">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogSection() {
  // FR: "wait until the user fully type what they want to search, and give
  // a search icon for the user to finalise what they are searching for."
  // `searchInput` tracks what's typed; `committedSearch` is only updated on
  // submit (Enter or the search button), so the (relatively expensive,
  // full-table-scanning) audit log query doesn't re-run on every keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const logs = useQuery(api.admin.listAuditLog, {
    search: committedSearch.trim() || undefined,
  });

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setCommittedSearch(searchInput);
  };

  if (logs === undefined) {
    return <AdminSectionLoading />;
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Head administrator"
        title="Administration audit log"
        description="A read-only accountability trail for administrator access, incident case updates, and programme setting changes."
        action={
          <AdminStatusBadge tone="neutral">
            Latest {logs.length} event{logs.length === 1 ? "" : "s"}
          </AdminStatusBadge>
        }
      />

      <form onSubmit={handleSearchSubmit} className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by event, administrator, target, or reason..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="icon" aria-label="Search audit log">
          <Search />
        </Button>
      </form>

      <Card className="overflow-hidden py-0">
        {logs.length === 0 ? (
          <AdminEmptyState
            icon={ScrollText}
            title="No audit events yet"
            description="Successful administration changes will be recorded here."
          />
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#f2efe5]">
                <TableRow>
                  <TableHead className="pl-5">Event</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="pr-5">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={String(log._id)}>
                    <TableCell className="pl-5">
                      <AdminStatusBadge tone={actionTone(log.action)}>
                        {formatAdminLabel(log.action)}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {log.actorName}
                    </TableCell>
                    <TableCell>
                      {log.targetEmail || (
                        <span className="text-muted-foreground">Programme</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-80 whitespace-normal text-muted-foreground">
                      {log.reason || "—"}
                    </TableCell>
                    <TableCell>
                      {formatAdminDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye />
                        View more details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <AuditLogDetailDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}

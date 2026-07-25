"use client";

import { useQuery } from "convex/react";
import { ScrollText } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  formatAdminDateTime,
  formatAdminLabel,
} from "@/components/admin/admin-shared";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function actionTone(action: string) {
  if (action.includes("revoked")) return "danger" as const;
  if (action.includes("bootstrapped") || action.includes("claimed")) {
    return "success" as const;
  }
  if (action.includes("updated")) return "info" as const;
  return "neutral" as const;
}

export function AuditLogSection() {
  const logs = useQuery(api.admin.listAuditLog);

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
                  <TableHead className="pr-5">Timestamp</TableHead>
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
                    <TableCell className="pr-5">
                      {formatAdminDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

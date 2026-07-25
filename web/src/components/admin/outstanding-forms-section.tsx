"use client";

import { useQuery } from "convex/react";
import { ClipboardCheck, Clock3 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  formatAdminDate,
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

export function OutstandingFormsSection() {
  const forms = useQuery(api.admin.listOutstandingForms);

  if (forms === undefined) {
    return <AdminSectionLoading />;
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Follow-up queue"
        title="Outstanding forms"
        description="Pulse surveys and exit feedback still awaiting submission, ordered by their due date."
        action={
          <AdminStatusBadge tone={forms.length > 0 ? "warning" : "success"}>
            {forms.length} pending
          </AdminStatusBadge>
        }
      />

      <Card className="overflow-hidden py-0">
        {forms.length === 0 ? (
          <AdminEmptyState
            icon={ClipboardCheck}
            title="No outstanding forms"
            description="Every currently assigned pulse survey and exit feedback form has been submitted."
          />
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#f2efe5]">
                <TableRow>
                  <TableHead className="pl-5">Form</TableHead>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="pr-5 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={`${form.type}-${form.id}`}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <Clock3 className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-primary">
                            {formatAdminLabel(form.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned {formatAdminDate(form.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {form.respondentName}
                    </TableCell>
                    <TableCell>
                      {formatAdminLabel(form.respondentRole)}
                    </TableCell>
                    <TableCell>{formatAdminDate(form.dueAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <AdminStatusBadge tone="warning">Pending</AdminStatusBadge>
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

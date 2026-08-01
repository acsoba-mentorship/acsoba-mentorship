"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Ban, Loader2, ShieldOff } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  formatAdminDate,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminInternship =
  FunctionReturnType<typeof api.internships.listAllForAdmin>[number];
type AdminMentorship =
  FunctionReturnType<typeof api.mentorships.listActiveForAdmin>[number];

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
      setReason("");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="takedown-reason">Reason (optional, shown to affected users)</Label>
          <Textarea
            id="takedown-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        {error && <AdminError message={error} />}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Ban />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InternshipRow({ internship }: { internship: AdminInternship }) {
  const adminTakeDown = useMutation(api.internships.adminTakeDown);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isClosed = internship.status === "closed";

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-primary">{internship.role}</p>
          <AdminStatusBadge tone={isClosed ? "neutral" : "success"}>
            {internship.status}
          </AdminStatusBadge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {internship.companyName} · Offered by {internship.offerorName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Closes {formatAdminDate(internship.closingDate)}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={isClosed}
        onClick={() => setDialogOpen(true)}
        className="shrink-0"
      >
        <Ban />
        {isClosed ? "Taken down" : "Take down"}
      </Button>
      <ReasonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`Take down "${internship.role}"?`}
        description="This closes the posting. The offeror and everyone who already applied will be notified."
        confirmLabel="Take down"
        onConfirm={(reason) =>
          adminTakeDown({
            internshipId: internship._id,
            reason: reason || undefined,
          }).then(() => undefined)
        }
      />
    </div>
  );
}

function MentorshipRow({ mentorship }: { mentorship: AdminMentorship }) {
  const endMentorshipImmediately = useMutation(
    api.admin.endMentorshipImmediately
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-primary">
          {mentorship.mentorName} ↔ {mentorship.menteeName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Started {formatAdminDate(mentorship.startDate)}
          {mentorship.plannedEndDate
            ? ` · Planned end ${formatAdminDate(mentorship.plannedEndDate)}`
            : ""}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="shrink-0"
      >
        <ShieldOff />
        End immediately
      </Button>
      <ReasonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="End this mentorship immediately?"
        description="This skips the normal exit-feedback process. Both the mentor and mentee will be notified right away."
        confirmLabel="End mentorship"
        onConfirm={(reason) =>
          endMentorshipImmediately({
            mentorshipId: mentorship._id,
            reason: reason || undefined,
          }).then(() => undefined)
        }
      />
    </div>
  );
}

export function ListingsSection() {
  const internships = useQuery(api.internships.listAllForAdmin);
  const mentorships = useQuery(api.mentorships.listActiveForAdmin);

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Moderation"
        title="Listings & mentorships"
        description="Take down internship postings or end an active mentorship immediately. Everyone affected is notified."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internship postings</CardTitle>
          <CardDescription>
            Taking a posting down closes it and notifies the offeror plus
            every applicant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {internships === undefined ? (
            <AdminSectionLoading rows={3} />
          ) : internships.length === 0 ? (
            <AdminEmptyState
              title="No internship postings yet"
              description="Postings will appear here once members start offering internships."
            />
          ) : (
            internships.map((internship) => (
              <InternshipRow key={internship._id} internship={internship} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active mentorships</CardTitle>
          <CardDescription>
            Ending a mentorship immediately skips the normal exit-feedback
            flow and notifies both the mentor and the mentee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mentorships === undefined ? (
            <AdminSectionLoading rows={3} />
          ) : mentorships.length === 0 ? (
            <AdminEmptyState
              title="No active mentorships"
              description="Active mentorships will appear here."
            />
          ) : (
            mentorships.map((mentorship) => (
              <MentorshipRow key={mentorship._id} mentorship={mentorship} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

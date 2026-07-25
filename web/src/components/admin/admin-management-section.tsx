"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Crown,
  Loader2,
  Mail,
  ShieldCheck,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  AdminSuccess,
  formatAdminDate,
  formatAdminLabel,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";

type AdminMembership =
  FunctionReturnType<typeof api.admin.listMemberships>[number];

function membershipStatusTone(status: AdminMembership["status"]) {
  if (status === "active") return "success" as const;
  if (status === "invited") return "warning" as const;
  return "neutral" as const;
}

function RevokeAdminDialog({
  membership,
  onRevoked,
}: {
  membership: AdminMembership;
  onRevoked: (email: string) => void;
}) {
  const revokeAdmin = useMutation(api.admin.revokeAdmin);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await revokeAdmin({
        membershipId: membership._id,
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      setReason("");
      onRevoked(membership.email);
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserMinus />
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke administrator access?</DialogTitle>
          <DialogDescription>
            {membership.email} will lose access immediately. Their account and
            programme profile will not be deleted.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor={`revoke-reason-${membership._id}`} className="text-sm font-semibold">
            Reason (optional)
          </label>
          <Textarea
            id={`revoke-reason-${membership._id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={4}
            className="mt-2"
            placeholder="Add context for the audit trail."
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {reason.length}/500
          </p>
        </div>
        {error && <AdminError message={error} />}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <UserMinus />}
            Revoke access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminManagementSection() {
  const memberships = useQuery(api.admin.listMemberships);
  const inviteAdmin = useMutation(api.admin.inviteAdmin);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (memberships === undefined) {
    return <AdminSectionLoading />;
  }

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsInviting(true);
    setError(null);
    setSuccess(null);
    const invitedEmail = email.trim();

    try {
      await inviteAdmin({ email: invitedEmail });
      setEmail("");
      setSuccess(
        `${invitedEmail} was added. Access activates when that verified account next signs in.`
      );
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoked = (revokedEmail: string) => {
    setError(null);
    setSuccess(`${revokedEmail} no longer has administrator access.`);
  };

  const activeCount = memberships.filter(
    (membership) => membership.status === "active"
  ).length;

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Head administrator"
        title="Administrator access"
        description="Invite programme administrators by verified sign-in email and revoke ordinary admin access. Membership changes are written to the audit log."
        action={
          <AdminStatusBadge tone="success">
            {activeCount} active administrator{activeCount === 1 ? "" : "s"}
          </AdminStatusBadge>
        }
      />

      <Card className="border-[#d9c27a]/50 bg-[#fffdf7]">
        <CardHeader className="border-b border-[#d9c27a]/30 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <UserPlus className="size-5 text-[#8b6d1e]" />
            Add an administrator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInvite}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="admin-email" className="text-sm font-semibold">
                Verified sign-in email
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  required
                  maxLength={320}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="bg-background pl-9"
                  placeholder="administrator@example.org"
                />
              </div>
            </div>
            <Button type="submit" disabled={isInviting || !email.trim()}>
              {isInviting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UserPlus />
              )}
              Add administrator
            </Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            The membership remains invited until that exact verified email next
            signs in. No Auth0 identity is created and no email is sent.
          </p>
          <div className="mt-4 space-y-3">
            {error && <AdminError message={error} />}
            {success && <AdminSuccess message={success} />}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        {memberships.length === 0 ? (
          <AdminEmptyState
            icon={UsersRound}
            title="No administrator memberships"
            description="Use the form above to add the first ordinary administrator."
          />
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#f2efe5]">
                <TableRow>
                  <TableHead className="pl-5">Administrator</TableHead>
                  <TableHead>Access level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="pr-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={String(membership._id)}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          {membership.role === "head_admin" ? (
                            <Crown className="size-4 text-[#eedb9a]" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-primary">
                            {membership.userName || membership.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {membership.userName ? membership.email : "Account not linked"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {membership.role === "head_admin"
                        ? "Head administrator"
                        : "Administrator"}
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={membershipStatusTone(membership.status)}
                      >
                        {formatAdminLabel(membership.status)}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell>{formatAdminDate(membership.invitedAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      {membership.role === "admin" &&
                      membership.status !== "revoked" ? (
                        <RevokeAdminDialog
                          membership={membership}
                          onRevoked={handleRevoked}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {membership.role === "head_admin"
                            ? "Protected"
                            : "No active access"}
                        </span>
                      )}
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

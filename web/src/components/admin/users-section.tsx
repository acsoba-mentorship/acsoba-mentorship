"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, MessageSquare, Search, ShieldAlert, ShieldCheck, Users } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  AdminSuccess,
  formatAdminDate,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminUser = FunctionReturnType<typeof api.admin.listUsers>[number];

function SuspendDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const suspendUser = useMutation(api.admin.suspendUser);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuspend = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await suspendUser({ userId: user._id, reason: reason.trim() || undefined });
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
          <DialogTitle>Suspend {user.name ?? "this user"}</DialogTitle>
          <DialogDescription>
            They will not be able to sign in or use the app until an
            administrator reactivates the account. They will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">Reason (optional, shown to the user)</Label>
          <Textarea
            id="suspend-reason"
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
          <Button variant="destructive" onClick={handleSuspend} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
            Suspend account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const sendUserMessage = useMutation(api.admin.sendUserMessage);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await sendUserMessage({ userId: user._id, subject, message });
      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSuccess(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {user.name ?? "this user"}</DialogTitle>
          <DialogDescription>
            Sent as an in-app notification. Use this for volunteering
            follow-ups or any other reason you need to reach a member.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <AdminSuccess message="Message sent." />
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="message-subject">Subject</Label>
              <Input
                id="message-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
                placeholder="e.g. Following up on Beach Cleanup volunteering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-body">Message</Label>
              <Textarea
                id="message-body"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={2000}
              />
            </div>
            {error && <AdminError message={error} />}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button
              onClick={handleSend}
              disabled={isSaving || !subject.trim() || !message.trim()}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <MessageSquare />}
              Send message
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const reactivateUser = useMutation(api.admin.reactivateUser);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSuspended = user.accountStatus === "suspended";

  const handleReactivate = async () => {
    setIsReactivating(true);
    setError(null);
    try {
      await reactivateUser({ userId: user._id });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-primary">{user.name ?? "Unnamed member"}</p>
          <AdminStatusBadge tone={isSuspended ? "danger" : "success"}>
            {isSuspended ? "Suspended" : "Active"}
          </AdminStatusBadge>
          {user.isMentor && <Badge variant="outline">Mentor</Badge>}
          {user.isMentee && <Badge variant="outline">Mentee</Badge>}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {user.email ?? "No email"} {user.phoneNumber ? `· ${user.phoneNumber}` : ""}
        </p>
        {isSuspended && user.suspendedReason && (
          <p className="mt-1 text-xs text-muted-foreground">
            Reason: {user.suspendedReason}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {formatAdminDate(user.createdAt)}
        </p>
        {error && (
          <div className="mt-2">
            <AdminError message={error} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={() => setMessageOpen(true)}>
          <MessageSquare />
          Message
        </Button>
        {isSuspended ? (
          <Button size="sm" onClick={handleReactivate} disabled={isReactivating}>
            {isReactivating ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Reactivate
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setSuspendOpen(true)}
          >
            <ShieldAlert />
            Suspend
          </Button>
        )}
      </div>
      <SuspendDialog user={user} open={suspendOpen} onOpenChange={setSuspendOpen} />
      <MessageDialog user={user} open={messageOpen} onOpenChange={setMessageOpen} />
    </div>
  );
}

export function UsersSection() {
  const [search, setSearch] = useState("");
  const users = useQuery(api.admin.listUsers, { search: search.trim() || undefined });

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Membership"
        title="Users"
        description="Search members, message them, or temporarily suspend an account."
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, username, email, or phone..."
          className="pl-9"
        />
      </div>

      {users === undefined ? (
        <AdminSectionLoading rows={5} />
      ) : users.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={Users}
            title="No matching users"
            description="Try a different search term."
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-2">
            {users.map((user) => (
              <UserRow key={user._id} user={user} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

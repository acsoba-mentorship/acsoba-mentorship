"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  CheckCircle2,
  Loader2,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { ReportIncidentDialog } from "@/components/mentorships/report-incident-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GENERAL_PROGRAMME_SCOPE = "general-programme";

function formatRelationshipDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function RoleIncidentReportPage({
  role,
}: {
  role: "mentor" | "mentee";
}) {
  const targets = useQuery(api.incidentReports.listReportTargets, { role });
  const [selectedScope, setSelectedScope] = useState("");
  const selectedTarget = targets?.find(
    (target) => String(target.mentorshipId) === selectedScope
  );
  const hasValidSelection =
    selectedScope === GENERAL_PROGRAMME_SCOPE || Boolean(selectedTarget);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldAlert className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold">Report an incident</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Privately share a safety, conduct, harassment, or privacy concern
            from your {role} programme area with authorised Shepherds Programme
            administrators.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Choose the report scope</CardTitle>
            <CardDescription>
              Select a participant from one of your active mentorships, or
              explicitly choose a general programme concern that is not about
              a specific person.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor={`${role}-incident-scope`}>
                Participant or programme
              </Label>
              <Select
                value={selectedScope}
                onValueChange={setSelectedScope}
                disabled={targets === undefined}
              >
                <SelectTrigger
                  id={`${role}-incident-scope`}
                  className="w-full"
                >
                  <SelectValue
                    placeholder={
                      targets === undefined
                        ? "Loading active mentorships..."
                        : "Choose who or what this report concerns"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL_PROGRAMME_SCOPE}>
                    General programme concern — no participant
                  </SelectItem>
                  {targets?.map((target) => (
                    <SelectItem
                      key={String(target.mentorshipId)}
                      value={String(target.mentorshipId)}
                    >
                      {target.counterpartName} — {target.counterpartRole}, since{" "}
                      {formatRelationshipDate(target.startDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targets === undefined ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Checking your active {role} relationships
                </p>
              ) : targets.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You have no active {role} relationships. You can still submit
                  a general programme concern.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only active relationships available to your {role} account
                  are listed.
                </p>
              )}
            </div>

            {selectedTarget ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">
                  Relationship with {selectedTarget.counterpartName}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {selectedTarget.counterpartTitle} ·{" "}
                  {selectedTarget.counterpartRole}
                </p>
              </div>
            ) : selectedScope === GENERAL_PROGRAMME_SCOPE ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                This report will concern the programme generally and will not
                identify another participant.
              </div>
            ) : null}

            <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
              If anyone is in immediate danger or needs urgent medical help,
              contact local emergency services. This form is not monitored
              continuously.
            </div>

            {hasValidSelection ? (
              <ReportIncidentDialog
                reporterRole={role}
                mentorshipId={selectedTarget?.mentorshipId}
                participantName={selectedTarget?.counterpartName}
              />
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Choose a report scope to continue.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LockKeyhole className="size-4" />
                </span>
                <CardTitle className="text-base">How privacy works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your report is associated with your signed-in account and is
              available only to authorised programme administrators. Your
              contact details are shared for follow-up only when you opt in.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </span>
                <CardTitle className="text-base">What happens next</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The programme team can review the concern, record case notes, and
              update its status. If you allow contact, an administrator may
              follow up through the details on your account.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";

import { ReportIncidentDialog } from "@/components/mentorships/report-incident-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Report an Incident — ACS OBA Shepherds",
};

export default function ReportIncidentPage() {
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
            with authorised Shepherds Programme administrators.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Submit a private report</CardTitle>
            <CardDescription>
              Use this option for a general programme concern. To identify a
              specific mentorship automatically, report it from that
              mentorship&apos;s workspace instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
              If anyone is in immediate danger or needs urgent medical help,
              contact local emergency services. This form is not monitored
              continuously.
            </div>
            <ReportIncidentDialog />
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

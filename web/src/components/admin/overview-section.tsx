"use client";

import { useQuery } from "convex/react";
import {
  Activity,
  ClipboardClock,
  Flag,
  Handshake,
  HeartPulse,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
} from "@/components/admin/admin-shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const metricDefinitions = [
  {
    key: "totalUsers",
    label: "Programme members",
    description: "Registered community",
    icon: Users,
    tone: "bg-blue-50 text-blue-800",
  },
  {
    key: "activeMentorships",
    label: "Active mentorships",
    description: "Pairs in progress",
    icon: Handshake,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    key: "pendingForms",
    label: "Outstanding forms",
    description: "Follow-up required",
    icon: ClipboardClock,
    tone: "bg-amber-50 text-amber-900",
  },
  {
    key: "openIncidents",
    label: "Open incidents",
    description: "Awaiting resolution",
    icon: TriangleAlert,
    tone: "bg-red-50 text-red-800",
  },
] as const;

export function OverviewSection() {
  const overview = useQuery(api.admin.getOverview);

  if (overview === undefined) {
    return <AdminSectionLoading rows={5} />;
  }

  const needsAttention =
    overview.openIncidents + overview.supportFlags + overview.pendingForms;

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Programme health"
        title="Administration overview"
        description="A live operational snapshot of participation, relationship health, required follow-up, and safeguarding activity."
        action={
          <AdminStatusBadge
            tone={needsAttention > 0 ? "warning" : "success"}
            className="h-7 px-3"
          >
            {needsAttention > 0
              ? `${needsAttention} attention item${needsAttention === 1 ? "" : "s"}`
              : "All queues clear"}
          </AdminStatusBadge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricDefinitions.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.key} className="gap-3 overflow-hidden py-5">
              <CardContent className="flex items-start justify-between px-5">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-primary">
                    {overview[metric.key].toLocaleString("en-SG")}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{metric.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${metric.tone}`}
                >
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5 text-[#987721]" />
              Relationship health
            </CardTitle>
            <CardDescription>
              Submitted feedback and signals that may need programme support.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/10 bg-[#faf8f1] p-4">
              <div className="flex items-center justify-between">
                <HeartPulse className="size-5 text-primary/60" />
                <AdminStatusBadge tone="info">Pulse</AdminStatusBadge>
              </div>
              <p className="mt-6 text-2xl font-bold text-primary">
                {overview.submittedPulseSurveys}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted responses
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-[#faf8f1] p-4">
              <div className="flex items-center justify-between">
                <Flag className="size-5 text-primary/60" />
                <AdminStatusBadge
                  tone={overview.supportFlags > 0 ? "warning" : "success"}
                >
                  Support
                </AdminStatusBadge>
              </div>
              <p className="mt-6 text-2xl font-bold text-primary">
                {overview.supportFlags}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Responses requesting help
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-[#faf8f1] p-4">
              <div className="flex items-center justify-between">
                <ShieldCheck className="size-5 text-primary/60" />
                <AdminStatusBadge tone="neutral">Team</AdminStatusBadge>
              </div>
              <p className="mt-6 text-2xl font-bold text-primary">
                {overview.activeAdmins}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Active administrators
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Form completion</CardTitle>
            <CardDescription>
              Current pulse and exit survey workload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Pending pulse surveys</span>
                <span className="font-bold text-primary">
                  {overview.pendingPulseSurveys}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      overview.pendingForms
                        ? (overview.pendingPulseSurveys /
                            overview.pendingForms) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Pending exit feedback</span>
                <span className="font-bold text-primary">
                  {overview.pendingExitFeedback}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#c6a451]"
                  style={{
                    width: `${
                      overview.pendingForms
                        ? (overview.pendingExitFeedback /
                            overview.pendingForms) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-primary/10 bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-xs font-semibold tracking-wide text-white/55 uppercase">
                Exit responses received
              </p>
              <p className="mt-1 text-2xl font-bold">
                {overview.submittedExitFeedback}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

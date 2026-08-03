import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import {
  incidentReporterRoleValidator,
  incidentStatusValidator,
} from "./incidentReports/fields";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireOnboardingComplete,
} from "./auth";
import { createNotification } from "./notifications";
import { writeAdminAuditLog } from "./admin/audit";
import { fetchUsersById } from "./helper";
import {
  type FormAnswerInput,
  validateAndSnapshotAnswers,
} from "./formQuestions";

type ReporterRole = Infer<typeof incidentReporterRoleValidator>;

function clampLimit(limit?: number) {
  return Math.min(Math.max(Math.floor(limit ?? 100), 1), 200);
}

function requireReporterRole(user: Doc<"users">, role: ReporterRole) {
  if (role === "mentor" && !user.mentorProfile) {
    throw new Error("Only mentors can report from the mentor programme area");
  }
  if (role === "mentee" && !user.menteeProfile) {
    throw new Error("Only mentees can report from the mentee programme area");
  }
}

export async function listReportTargets(
  ctx: QueryCtx,
  { role }: { role: ReporterRole }
) {
  const reporter = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  requireReporterRole(reporter, role);

  const mentorships =
    role === "mentor"
      ? await ctx.db
          .query("mentorships")
          .withIndex("by_mentorId_status", (q) =>
            q.eq("mentorId", reporter._id).eq("status", "active")
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("mentorships")
          .withIndex("by_menteeId_status", (q) =>
            q.eq("menteeId", reporter._id).eq("status", "active")
          )
          .order("desc")
          .collect();
  const counterpartIds = mentorships.map((mentorship) =>
    role === "mentor" ? mentorship.menteeId : mentorship.mentorId
  );
  const counterpartById = await fetchUsersById(ctx, counterpartIds);

  return mentorships.map((mentorship) => {
    const counterpartId =
      role === "mentor" ? mentorship.menteeId : mentorship.mentorId;
    const counterpart = counterpartById.get(counterpartId);

    return {
      mentorshipId: mentorship._id,
      counterpartId,
      counterpartName: counterpart?.name?.trim() || "Unknown user",
      counterpartTitle: counterpart?.title?.trim() || "Community member",
      counterpartRole:
        role === "mentor" ? ("mentee" as const) : ("mentor" as const),
      startDate: mentorship.startDate,
    };
  });
}

export async function submit(
  ctx: MutationCtx,
  {
    reporterRole,
    mentorshipId,
    answers,
  }: {
    reporterRole: ReporterRole;
    mentorshipId?: Id<"mentorships">;
    answers: FormAnswerInput[];
  }
) {
  const reporter = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  requireReporterRole(reporter, reporterRole);
  let reportedUserId: Id<"users"> | undefined;

  if (mentorshipId) {
    const mentorship = await ctx.db.get("mentorships", mentorshipId);
    if (!mentorship) {
      throw new Error("Mentorship not found");
    }
    if (mentorship.status !== "active") {
      throw new Error("Only active mentorships can be selected for a report");
    }
    if (reporterRole === "mentor" && mentorship.mentorId === reporter._id) {
      reportedUserId = mentorship.menteeId;
    } else if (
      reporterRole === "mentee" &&
      mentorship.menteeId === reporter._id
    ) {
      reportedUserId = mentorship.mentorId;
    } else {
      throw new Error(
        "This mentorship is not available from the selected programme role"
      );
    }
  }

  const now = Date.now();
  const validatedAnswers = await validateAndSnapshotAnswers(
    ctx,
    "incident_report",
    answers
  );
  const answerValue = (key: string) => {
    const answer = validatedAnswers.find((item) => item.questionKey === key);
    return answer && !Array.isArray(answer.value) ? answer.value : undefined;
  };
  const categoryByLabel = {
    Misconduct: "misconduct",
    Harassment: "harassment",
    "Safety concern": "safety",
    "Privacy concern": "privacy",
    Other: "other",
  } as const;
  const severityByLabel = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Urgent: "urgent",
  } as const;
  const categoryAnswer = answerValue("incident_category");
  const severityAnswer = answerValue("incident_severity");
  const dateAnswer = answerValue("incident_date");
  const parsedOccurredAt = dateAnswer ? Date.parse(dateAnswer) : Number.NaN;
  const occurredAt =
    Number.isFinite(parsedOccurredAt) && parsedOccurredAt <= now
      ? parsedOccurredAt
      : undefined;
  const allowContact = answerValue("incident_allow_contact") === "Yes";

  return ctx.db.insert("incidentReports", {
    reporterId: reporter._id,
    reporterRole,
    reportedUserId,
    mentorshipId,
    category: categoryAnswer
      ? categoryByLabel[categoryAnswer as keyof typeof categoryByLabel]
      : undefined,
    severity: severityAnswer
      ? severityByLabel[severityAnswer as keyof typeof severityByLabel]
      : undefined,
    description: answerValue("incident_description"),
    occurredAt,
    allowContact,
    answers: validatedAnswers,
    status: "open",
    createdAt: now,
    updatedAt: now,
  });
}

export async function listMine(
  ctx: QueryCtx,
  { limit }: { limit?: number }
) {
  const reporter = await getAuthenticatedUser(ctx);
  const reports = await ctx.db
    .query("incidentReports")
    .withIndex("by_reporterId", (q) => q.eq("reporterId", reporter._id))
    .order("desc")
    .take(clampLimit(limit));

  return reports.map((report) => ({
    _id: report._id,
    category: report.category ?? null,
    severity: report.severity ?? null,
    status: report.status,
    reporterRole: report.reporterRole ?? null,
    mentorshipId: report.mentorshipId ?? null,
    occurredAt: report.occurredAt ?? null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }));
}

export async function listForAdmin(
  ctx: QueryCtx,
  {
    status,
  }: {
    status?: Infer<typeof incidentStatusValidator>;
  }
) {
  await requireAdmin(ctx);
  const reports = status
    ? await ctx.db
        .query("incidentReports")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect()
    : await ctx.db.query("incidentReports").order("desc").collect();

  const people = await Promise.all(
    reports.flatMap((report) => [
      ctx.db.get("users", report.reporterId),
      report.reportedUserId
        ? ctx.db.get("users", report.reportedUserId)
        : Promise.resolve(null),
    ])
  );

  return reports.map((report, index) => {
    const reporter = people[index * 2];
    const reportedUser = people[index * 2 + 1];
    return {
      _id: report._id,
      reporterName: reporter?.name ?? "Unknown user",
      reporterEmail: report.allowContact ? reporter?.email ?? null : null,
      reporterRole: report.reporterRole ?? null,
      reportedUserName: reportedUser?.name ?? null,
      mentorshipId: report.mentorshipId ?? null,
      category: report.category ?? null,
      severity: report.severity ?? null,
      description: report.description ?? null,
      occurredAt: report.occurredAt ?? null,
      allowContact: report.allowContact ?? false,
      answers:
        report.answers ??
        [
          report.category
            ? {
                questionKey: "incident_category",
                prompt: "Which category best describes the incident?",
                responseType: "single_choice" as const,
                value: report.category,
              }
            : null,
          report.severity
            ? {
                questionKey: "incident_severity",
                prompt: "How urgent is this concern?",
                responseType: "single_choice" as const,
                value: report.severity,
              }
            : null,
          report.occurredAt
            ? {
                questionKey: "incident_date",
                prompt: "When did the incident occur?",
                responseType: "short_text" as const,
                value: new Date(report.occurredAt).toISOString().slice(0, 10),
              }
            : null,
          report.description
            ? {
                questionKey: "incident_description",
                prompt: "What happened?",
                responseType: "long_text" as const,
                value: report.description,
              }
            : null,
          {
            questionKey: "incident_allow_contact",
            prompt: "May programme admins contact you about this report?",
            responseType: "single_choice" as const,
            value: report.allowContact ? "Yes" : "No",
          },
        ].filter((answer) => answer !== null),
      status: report.status,
      assignedAdminId: report.assignedAdminId ?? null,
      adminNotes: report.adminNotes ?? null,
      resolvedAt: report.resolvedAt ?? null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  });
}

export async function updateForAdmin(
  ctx: MutationCtx,
  {
    reportId,
    status,
    adminNotes,
  }: {
    reportId: Id<"incidentReports">;
    status: Infer<typeof incidentStatusValidator>;
    adminNotes?: string;
  }
) {
  const { user: admin } = await requireAdmin(ctx);
  const report = await ctx.db.get("incidentReports", reportId);
  if (!report) {
    throw new Error("Incident report not found");
  }

  const notes = adminNotes?.trim();
  if (notes && notes.length > 3000) {
    throw new Error("Administrator notes must be 3000 characters or fewer");
  }

  const now = Date.now();
  const isClosed = status === "resolved" || status === "dismissed";
  await ctx.db.patch("incidentReports", report._id, {
    status,
    assignedAdminId: admin._id,
    adminNotes: notes,
    resolvedAt: isClosed ? now : undefined,
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: report.reporterId,
    type: "incident_updated",
    title: "Incident report updated",
    message: `Your incident report is now ${status.replace("_", " ")}.`,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "incident_report.updated",
    targetType: "incident_report",
    targetId: String(report._id),
    targetUserId: report.reporterId,
    metadata: { fromStatus: report.status, toStatus: status, adminNotes: notes },
  });

  return report._id;
}

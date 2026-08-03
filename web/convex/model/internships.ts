import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { CAREER_STAGE } from "./users/fields";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireOnboardingComplete,
} from "./auth";
import { fetchUsersById } from "./helper";
import { createNotification } from "./notifications";
import { writeAdminAuditLog } from "./admin/audit";

const TITLE_MAX = 120;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 4000;
const START_PERIOD_MAX = 80;
const NOTE_MAX = 1000;
const DECISION_MESSAGE_MAX = 2000;
const ACCEPTANCE_MESSAGE_MIN = 20;
const ACCEPTANCE_MESSAGE_MAX = 500;
const CONTACT_DETAILS_MAX = 300;
const START_ARRANGEMENTS_MAX = 500;
const CV_FILE_NAME_MAX = 255;
const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_CONTENT_TYPE_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
const CONTACT_METHOD_LABELS = {
  email: "email",
  phone: "phone",
  whatsapp: "WhatsApp",
  other: "the provided contact method",
} as const;

function clampLimit(limit?: number) {
  return Math.min(Math.max(Math.floor(limit ?? 50), 1), 200);
}

function normalizeRequiredText(value: string, label: string, max: number, min = 1) {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ConvexError(`${label} must be at least ${min} characters`);
  }
  if (trimmed.length > max) {
    throw new ConvexError(`${label} must be ${max} characters or fewer`);
  }
  return trimmed;
}

function normalizeCvFileName(fileName: string) {
  const normalized = fileName.trim().split(/[\\/]/).pop() ?? "";
  if (!normalized || normalized.length > CV_FILE_NAME_MAX) {
    throw new ConvexError(
      `CV file name must be between 1 and ${CV_FILE_NAME_MAX} characters`
    );
  }
  return normalized;
}

function expectedCvContentType(fileName: string) {
  const extension = fileName
    .slice(fileName.lastIndexOf("."))
    .toLowerCase() as keyof typeof CV_CONTENT_TYPE_BY_EXTENSION;
  const contentType = CV_CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    throw new ConvexError("CV must be a PDF, DOC, or DOCX file");
  }
  return contentType;
}

/**
 * FR17 restricts expressing interest in an internship to "ACSOBA members
 * who are still in school or not employed". Students and members between
 * study and work are eligible; a professional is assumed to be employed.
 * Records created before career stage was introduced remain eligible.
 */
export function isEligibleForInternshipInterest(user: Doc<"users">) {
  return user.careerStage !== CAREER_STAGE.PROFESSIONAL;
}

function isPostingOpen(internship: Doc<"internships">, now = Date.now()) {
  return internship.status === "open" && internship.closingDate > now;
}

async function effectiveStatus(internship: Doc<"internships">, now = Date.now()) {
  if (internship.status === "open" && internship.closingDate <= now) {
    return "closed" as const;
  }
  return internship.status;
}

export async function offer(
  ctx: MutationCtx,
  {
    companyName,
    role,
    description,
    startPeriod,
    duration,
    isPaid,
    closingDate,
    confirmedAuthority,
  }: {
    companyName: string;
    role: string;
    description: string;
    startPeriod: string;
    duration: string;
    isPaid: boolean;
    closingDate: number;
    confirmedAuthority: boolean;
  }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (!confirmedAuthority) {
    throw new ConvexError(
      "You must confirm you have the authority to offer this internship"
    );
  }

  const now = Date.now();
  if (!Number.isFinite(closingDate) || closingDate <= now) {
    throw new ConvexError("Closing date to apply must be in the future");
  }

  return ctx.db.insert("internships", {
    offerorId: offeror._id,
    companyName: normalizeRequiredText(companyName, "Company/organisation", 200),
    role: normalizeRequiredText(role, "Internship title", TITLE_MAX),
    description: normalizeRequiredText(
      description,
      "Description",
      DESCRIPTION_MAX,
      DESCRIPTION_MIN
    ),
    startPeriod: normalizeRequiredText(
      startPeriod,
      "Approximate start period",
      START_PERIOD_MAX
    ),
    duration: normalizeRequiredText(duration, "Duration", 60),
    isPaid,
    closingDate,
    confirmedAuthority: true,
    status: "open",
    createdAt: now,
    updatedAt: now,
  });
}

export async function listOpen(ctx: QueryCtx, { limit }: { limit?: number }) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const now = Date.now();

  const postings = await ctx.db
    .query("internships")
    .withIndex("by_status_closingDate", (q) =>
      q.eq("status", "open").gt("closingDate", now)
    )
    .order("desc")
    .take(clampLimit(limit));

  const offerorById = await fetchUsersById(
    ctx,
    postings.map((posting) => posting.offerorId)
  );

  const myInterests = await ctx.db
    .query("internshipInterests")
    .withIndex("by_applicantId", (q) => q.eq("applicantId", user._id))
    .collect();
  const interestedInternshipIds = new Set(
    myInterests.map((interest) => interest.internshipId)
  );

  return postings.map((posting) => {
    const offeror = offerorById.get(posting.offerorId);
    return {
      _id: posting._id,
      companyName: posting.companyName,
      role: posting.role,
      description: posting.description,
      startPeriod: posting.startPeriod ?? null,
      duration: posting.duration,
      isPaid: posting.isPaid,
      closingDate: posting.closingDate,
      offerorName: offeror?.name ?? "Unknown member",
      isMine: posting.offerorId === user._id,
      alreadyExpressedInterest: interestedInternshipIds.has(posting._id),
      createdAt: posting.createdAt,
    };
  });
}

/**
 * Return a full posting to its owner, or to any onboarded member while the
 * posting remains open. Closed and expired postings are not discoverable by
 * other members through a guessed document ID.
 */
export async function getPosting(
  ctx: QueryCtx,
  { internshipId }: { internshipId: Id<"internships"> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const posting = await ctx.db.get("internships", internshipId);

  if (
    !posting ||
    (posting.offerorId !== user._id && !isPostingOpen(posting))
  ) {
    throw new ConvexError("Internship posting not found");
  }

  const offeror = await ctx.db.get("users", posting.offerorId);
  const existingInterest = await ctx.db
    .query("internshipInterests")
    .withIndex("by_internshipId_applicantId", (q) =>
      q.eq("internshipId", internshipId).eq("applicantId", user._id)
    )
    .unique();

  return {
    _id: posting._id,
    companyName: posting.companyName,
    role: posting.role,
    description: posting.description,
    startPeriod: posting.startPeriod ?? null,
    duration: posting.duration,
    isPaid: posting.isPaid,
    closingDate: posting.closingDate,
    offerorName: offeror?.name ?? "Unknown member",
    isMine: posting.offerorId === user._id,
    isOpen: isPostingOpen(posting),
    alreadyExpressedInterest: existingInterest !== null,
    createdAt: posting.createdAt,
  };
}

export async function myOffered(ctx: QueryCtx) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const now = Date.now();

  const postings = await ctx.db
    .query("internships")
    .withIndex("by_offerorId", (q) => q.eq("offerorId", offeror._id))
    .order("desc")
    .collect();

  const counts = await Promise.all(
    postings.map((posting) =>
      ctx.db
        .query("internshipInterests")
        .withIndex("by_internshipId", (q) => q.eq("internshipId", posting._id))
        .collect()
    )
  );

  return postings.map((posting, index) => ({
    ...posting,
    status: isPostingOpen(posting, now) ? posting.status : "closed",
    interestCount: counts[index].length,
    pendingApplicationCount: counts[index].filter(
      (interest) =>
        interest.status === "submitted" || interest.status === "acknowledged"
    ).length,
  }));
}

export async function updateStatus(
  ctx: MutationCtx,
  {
    internshipId,
    status,
  }: { internshipId: Id<"internships">; status: "open" | "filled" | "closed" }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const internship = await ctx.db.get("internships", internshipId);

  if (!internship || internship.offerorId !== offeror._id) {
    throw new ConvexError("Internship posting not found");
  }

  await ctx.db.patch("internships", internshipId, {
    status,
    updatedAt: Date.now(),
  });

  return internshipId;
}

/**
 * Admin view of every internship posting regardless of status, used by the
 * admin "take down" workflow.
 */
export async function listAllForAdmin(ctx: QueryCtx) {
  await requireAdmin(ctx);
  const postings = await ctx.db.query("internships").order("desc").collect();

  const offerorById = await fetchUsersById(
    ctx,
    postings.map((posting) => posting.offerorId)
  );

  return postings.map((posting) => ({
    _id: posting._id,
    companyName: posting.companyName,
    role: posting.role,
    isPaid: posting.isPaid,
    status: posting.status,
    closingDate: posting.closingDate,
    offerorName: offerorById.get(posting.offerorId)?.name ?? "Unknown user",
    createdAt: posting._creationTime,
  }));
}

/**
 * FR: "Admins are able to take down internships/volunteering activities...
 * All users affected will be notified (such as the person who set up the
 * internship/volunteer, the mentee and the mentor)." Closes the posting and
 * notifies the offeror plus everyone who had already applied.
 */
export async function adminTakeDown(
  ctx: MutationCtx,
  { internshipId, reason }: { internshipId: Id<"internships">; reason?: string }
) {
  const { user: admin } = await requireAdmin(ctx);
  const internship = await ctx.db.get("internships", internshipId);
  if (!internship) {
    throw new ConvexError("Internship posting not found");
  }
  if (internship.status === "closed") {
    return internshipId;
  }

  const cleanReason = reason?.trim();
  if (cleanReason && cleanReason.length > 500) {
    throw new ConvexError("Reason must be 500 characters or fewer");
  }

  await ctx.db.patch("internships", internshipId, {
    status: "closed",
    updatedAt: Date.now(),
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "internship.taken_down",
    targetType: "internship",
    targetId: String(internshipId),
    reason: cleanReason,
    metadata: { role: internship.role },
  });

  const interests = await ctx.db
    .query("internshipInterests")
    .withIndex("by_internshipId", (q) => q.eq("internshipId", internshipId))
    .collect();

  const notifyMessage = cleanReason
    ? `An administrator has taken down "${internship.role}" at ${internship.companyName}: ${cleanReason}`
    : `An administrator has taken down "${internship.role}" at ${internship.companyName}.`;

  const notifiedUserIds = new Set<Id<"users">>([internship.offerorId]);
  for (const interest of interests) {
    notifiedUserIds.add(interest.applicantId);
  }

  await Promise.all(
    Array.from(notifiedUserIds).map((userId) =>
      createNotification(ctx, {
        userId,
        type: "internship_taken_down",
        title: "Internship posting taken down",
        message: notifyMessage,
      })
    )
  );

  return internshipId;
}

export async function generateCvUploadUrl(ctx: MutationCtx) {
  const applicant = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  if (!isEligibleForInternshipInterest(applicant)) {
    throw new ConvexError(
      "Only ACSOBA members who are still in school or not employed can apply for internships"
    );
  }
  return ctx.storage.generateUploadUrl();
}

export async function persistApplication(
  ctx: MutationCtx,
  {
    internshipId,
    note,
    cvStorageId,
    cvFileName,
    cvContentType,
    cvSize,
  }: {
    internshipId: Id<"internships">;
    note?: string;
    cvStorageId: Id<"_storage">;
    cvFileName: string;
    cvContentType: string;
    cvSize: number;
  }
) {
  const applicant = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (!isEligibleForInternshipInterest(applicant)) {
    throw new ConvexError(
      "Only ACSOBA members who are still in school or not employed can indicate interest in internships"
    );
  }

  const internship = await ctx.db.get("internships", internshipId);
  if (!internship) {
    throw new ConvexError("Internship posting not found");
  }
  if (internship.offerorId === applicant._id) {
    throw new ConvexError("You cannot express interest in your own posting");
  }
  if (!isPostingOpen(internship)) {
    throw new ConvexError("This internship is no longer accepting interest");
  }

  const existing = await ctx.db
    .query("internshipInterests")
    .withIndex("by_internshipId_applicantId", (q) =>
      q.eq("internshipId", internshipId).eq("applicantId", applicant._id)
    )
    .unique();
  if (existing) {
    throw new ConvexError("You have already indicated interest in this internship");
  }

  const existingCvReference = await ctx.db
    .query("internshipInterests")
    .withIndex("by_cvStorageId", (q) => q.eq("cvStorageId", cvStorageId))
    .first();
  if (existingCvReference) {
    throw new ConvexError("This CV upload has already been used");
  }

  const cvMetadata = await ctx.db.system.get(cvStorageId);
  if (!cvMetadata) {
    throw new ConvexError("Uploaded CV could not be found");
  }

  const trimmedNote = note?.trim();
  if (trimmedNote && trimmedNote.length > NOTE_MAX) {
    throw new ConvexError(`Note must be ${NOTE_MAX} characters or fewer`);
  }

  const normalizedCvFileName = normalizeCvFileName(cvFileName);
  const expectedContentType = expectedCvContentType(normalizedCvFileName);
  if (cvSize <= 0 || cvSize > CV_MAX_BYTES) {
    throw new ConvexError("CV must be a non-empty file no larger than 5 MiB");
  }
  if (cvContentType !== expectedContentType) {
    throw new ConvexError(
      "CV file type does not match its extension; upload a PDF, DOC, or DOCX file"
    );
  }

  const now = Date.now();
  const interestId = await ctx.db.insert("internshipInterests", {
    internshipId,
    applicantId: applicant._id,
    note: trimmedNote || undefined,
    cvStorageId,
    cvFileName: normalizedCvFileName,
    cvContentType,
    cvSize,
    status: "submitted",
    createdAt: now,
  });

  await createNotification(ctx, {
    userId: internship.offerorId,
    type: "internship_interest_received",
    title: "New internship interest",
    message: `${applicant.name} is interested in the ${internship.role} internship you offered.`,
    href: "/internships?tab=my-postings",
  });

  return interestId;
}

export async function deleteUnreferencedCvUpload(
  ctx: MutationCtx,
  { cvStorageId }: { cvStorageId: Id<"_storage"> }
) {
  const existingCvReference = await ctx.db
    .query("internshipInterests")
    .withIndex("by_cvStorageId", (q) => q.eq("cvStorageId", cvStorageId))
    .first();

  if (existingCvReference) {
    return false;
  }

  const cvMetadata = await ctx.db.system.get(cvStorageId);
  if (!cvMetadata) {
    return false;
  }

  await ctx.storage.delete(cvStorageId);
  return true;
}

export async function listInterestsForPosting(
  ctx: QueryCtx,
  { internshipId }: { internshipId: Id<"internships"> }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const internship = await ctx.db.get("internships", internshipId);

  if (!internship || internship.offerorId !== offeror._id) {
    throw new ConvexError("Internship posting not found");
  }

  const interests = await ctx.db
    .query("internshipInterests")
    .withIndex("by_internshipId", (q) => q.eq("internshipId", internshipId))
    .order("desc")
    .collect();

  const applicantById = await fetchUsersById(
    ctx,
    interests.map((interest) => interest.applicantId)
  );

  return interests.map((interest) => {
    const applicant = applicantById.get(interest.applicantId);
    return {
      _id: interest._id,
      applicantName: applicant?.name ?? "Unknown member",
      status:
        interest.status === "acknowledged" ? "submitted" : interest.status,
      createdAt: interest.createdAt,
    };
  });
}

export async function getApplicationForOwner(
  ctx: QueryCtx,
  { interestId }: { interestId: Id<"internshipInterests"> }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const interest = await ctx.db.get("internshipInterests", interestId);
  if (!interest) {
    throw new ConvexError("Application not found");
  }

  const internship = await ctx.db.get("internships", interest.internshipId);
  if (!internship || internship.offerorId !== offeror._id) {
    throw new ConvexError("Application not found");
  }

  const applicant = await ctx.db.get("users", interest.applicantId);
  const cvDownloadUrl = interest.cvStorageId
    ? await ctx.storage.getUrl(interest.cvStorageId)
    : null;

  return {
    _id: interest._id,
    internshipRole: internship.role,
    internshipStartPeriod: internship.startPeriod ?? null,
    applicantName: applicant?.name ?? "Unknown member",
    applicantEmail: applicant?.email ?? null,
    applicantPhoneNumber: applicant?.phoneNumber ?? null,
    note: interest.note ?? null,
    cvFileName: interest.cvFileName ?? null,
    cvContentType: interest.cvContentType ?? null,
    cvSize: interest.cvSize ?? null,
    cvDownloadUrl,
    hasCv: interest.cvStorageId !== undefined && cvDownloadUrl !== null,
    status:
      interest.status === "acknowledged" ? "submitted" : interest.status,
    createdAt: interest.createdAt,
    decisionMessage: interest.decisionMessage ?? null,
    acceptanceContactMethod: interest.acceptanceContactMethod ?? null,
    acceptanceContactDetails: interest.acceptanceContactDetails ?? null,
    acceptanceStartArrangements:
      interest.acceptanceStartArrangements ?? null,
    decidedAt: interest.decidedAt ?? null,
  };
}

export async function decideApplication(
  ctx: MutationCtx,
  {
    interestId,
    decision,
    message,
    contactMethod,
    contactDetails,
    startArrangements,
  }: {
    interestId: Id<"internshipInterests">;
    decision: "accepted" | "rejected";
    message?: string;
    contactMethod?: "email" | "phone" | "whatsapp" | "other";
    contactDetails?: string;
    startArrangements?: string;
  }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const interest = await ctx.db.get("internshipInterests", interestId);
  if (!interest) {
    throw new ConvexError("Application not found");
  }

  const internship = await ctx.db.get("internships", interest.internshipId);
  if (!internship || internship.offerorId !== offeror._id) {
    throw new ConvexError("Application not found");
  }

  if (interest.status === "accepted" || interest.status === "rejected") {
    throw new ConvexError("This application has already been decided");
  }

  const accepted = decision === "accepted";
  let normalizedMessage = message?.trim() ?? "";
  let normalizedContactDetails: string | undefined;
  let normalizedStartArrangements: string | undefined;

  if (accepted) {
    if (!interest.cvStorageId) {
      throw new ConvexError(
        "Legacy applications without a CV cannot be accepted; reject this application instead"
      );
    }
    const cvMetadata = await ctx.db.system.get(
      "_storage",
      interest.cvStorageId
    );
    if (!cvMetadata) {
      throw new ConvexError(
        "This application's CV is unavailable, so it cannot be accepted"
      );
    }
    normalizedMessage = normalizeRequiredText(
      normalizedMessage,
      "Acceptance message",
      ACCEPTANCE_MESSAGE_MAX,
      ACCEPTANCE_MESSAGE_MIN
    );
    if (!contactMethod) {
      throw new ConvexError("Choose a contact method for the applicant");
    }
    normalizedContactDetails = normalizeRequiredText(
      contactDetails ?? "",
      "Contact details",
      CONTACT_DETAILS_MAX,
      3
    );
    normalizedStartArrangements = normalizeRequiredText(
      startArrangements ?? "",
      "Start arrangements",
      START_ARRANGEMENTS_MAX,
      10
    );
  } else if (normalizedMessage.length > DECISION_MESSAGE_MAX) {
    throw new ConvexError(
      `Decision message must be ${DECISION_MESSAGE_MAX} characters or fewer`
    );
  }

  const decidedAt = Date.now();
  await ctx.db.patch("internshipInterests", interestId, {
    status: decision,
    decisionMessage: normalizedMessage || undefined,
    acceptanceContactMethod: accepted ? contactMethod : undefined,
    acceptanceContactDetails: accepted
      ? normalizedContactDetails
      : undefined,
    acceptanceStartArrangements: accepted
      ? normalizedStartArrangements
      : undefined,
    decidedAt,
  });

  const postingStartPeriod =
    internship.startPeriod ?? "To be confirmed with the offeror";
  const notificationMessage = accepted
    ? `Your application for ${internship.role} was accepted. Posting start: ${postingStartPeriod}. Start arrangements: ${normalizedStartArrangements}. Contact via ${CONTACT_METHOD_LABELS[contactMethod!]}: ${normalizedContactDetails}. Message: ${normalizedMessage}`
    : `Your application for the ${internship.role} internship was not selected.${
        normalizedMessage ? ` ${normalizedMessage}` : ""
      }`;

  await createNotification(ctx, {
    userId: interest.applicantId,
    type: accepted
      ? "internship_application_accepted"
      : "internship_application_rejected",
    title: accepted
      ? "Internship application accepted"
      : "Internship application update",
    message: notificationMessage,
    href: "/internships?tab=my-interests",
  });

  return interestId;
}

export async function myInterests(ctx: QueryCtx) {
  const applicant = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const interests = await ctx.db
    .query("internshipInterests")
    .withIndex("by_applicantId", (q) => q.eq("applicantId", applicant._id))
    .order("desc")
    .collect();

  const internshipById = new Map(
    (
      await Promise.all(
        interests.map((interest) => ctx.db.get("internships", interest.internshipId))
      )
    ).map((internship) => [internship?._id, internship])
  );

  return Promise.all(
    interests.map(async (interest) => {
      const internship = internshipById.get(interest.internshipId);
      return {
        _id: interest._id,
        status:
          interest.status === "acknowledged" ? "submitted" : interest.status,
        createdAt: interest.createdAt,
        decisionMessage: interest.decisionMessage ?? null,
        acceptanceContactMethod: interest.acceptanceContactMethod ?? null,
        acceptanceContactDetails: interest.acceptanceContactDetails ?? null,
        acceptanceStartArrangements:
          interest.acceptanceStartArrangements ?? null,
        decidedAt: interest.decidedAt ?? null,
        internshipRole: internship?.role ?? "Internship no longer available",
        internshipCompany: internship?.companyName ?? "",
        internshipStartPeriod: internship?.startPeriod ?? null,
        internshipStatus: internship
          ? await effectiveStatus(internship)
          : "closed",
      };
    })
  );
}

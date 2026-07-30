import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { CAREER_STAGE } from "./users/fields";
import { getAuthenticatedUser, requireOnboardingComplete } from "./auth";
import { fetchUsersById } from "./helper";
import { createNotification } from "./notifications";

const TITLE_MAX = 120;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 4000;
const NOTE_MAX = 1000;

function clampLimit(limit?: number) {
  return Math.min(Math.max(Math.floor(limit ?? 50), 1), 200);
}

function normalizeRequiredText(value: string, label: string, max: number, min = 1) {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(`${label} must be at least ${min} characters`);
  }
  if (trimmed.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer`);
  }
  return trimmed;
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
    duration,
    isPaid,
    closingDate,
    confirmedAuthority,
  }: {
    companyName: string;
    role: string;
    description: string;
    duration: string;
    isPaid: boolean;
    closingDate: number;
    confirmedAuthority: boolean;
  }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (!confirmedAuthority) {
    throw new Error(
      "You must confirm you have the authority to offer this internship"
    );
  }

  const now = Date.now();
  if (!Number.isFinite(closingDate) || closingDate <= now) {
    throw new Error("Closing date to apply must be in the future");
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
    unacknowledgedCount: counts[index].filter(
      (interest) => interest.status === "submitted"
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
    throw new Error("Internship posting not found");
  }

  await ctx.db.patch("internships", internshipId, {
    status,
    updatedAt: Date.now(),
  });

  return internshipId;
}

export async function expressInterest(
  ctx: MutationCtx,
  { internshipId, note }: { internshipId: Id<"internships">; note?: string }
) {
  const applicant = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (!isEligibleForInternshipInterest(applicant)) {
    throw new Error(
      "Only ACSOBA members who are still in school or not employed can indicate interest in internships"
    );
  }

  const internship = await ctx.db.get("internships", internshipId);
  if (!internship) {
    throw new Error("Internship posting not found");
  }
  if (internship.offerorId === applicant._id) {
    throw new Error("You cannot express interest in your own posting");
  }
  if (!isPostingOpen(internship)) {
    throw new Error("This internship is no longer accepting interest");
  }

  const existing = await ctx.db
    .query("internshipInterests")
    .withIndex("by_internshipId_applicantId", (q) =>
      q.eq("internshipId", internshipId).eq("applicantId", applicant._id)
    )
    .unique();
  if (existing) {
    throw new Error("You have already indicated interest in this internship");
  }

  const trimmedNote = note?.trim();
  if (trimmedNote && trimmedNote.length > NOTE_MAX) {
    throw new Error(`Note must be ${NOTE_MAX} characters or fewer`);
  }

  const now = Date.now();
  const interestId = await ctx.db.insert("internshipInterests", {
    internshipId,
    applicantId: applicant._id,
    note: trimmedNote || undefined,
    status: "submitted",
    createdAt: now,
  });

  await createNotification(ctx, {
    userId: internship.offerorId,
    type: "internship_interest_received",
    title: "New internship interest",
    message: `${applicant.name} is interested in the ${internship.role} internship you offered.`,
    href: "/internships",
  });

  return interestId;
}

export async function listInterestsForPosting(
  ctx: QueryCtx,
  { internshipId }: { internshipId: Id<"internships"> }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const internship = await ctx.db.get("internships", internshipId);

  if (!internship || internship.offerorId !== offeror._id) {
    throw new Error("Internship posting not found");
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

  // FR17: "Internship offeror shall receive indications of interest and
  // contact details of member interested" — contact info is only exposed
  // here, to the offeror, and only for members who applied.
  return interests.map((interest) => {
    const applicant = applicantById.get(interest.applicantId);
    return {
      _id: interest._id,
      applicantName: applicant?.name ?? "Unknown member",
      applicantEmail: applicant?.email ?? null,
      applicantPhoneNumber: applicant?.phoneNumber ?? null,
      note: interest.note ?? null,
      status: interest.status,
      createdAt: interest.createdAt,
      acknowledgedAt: interest.acknowledgedAt ?? null,
    };
  });
}

export async function acknowledgeInterest(
  ctx: MutationCtx,
  { interestId }: { interestId: Id<"internshipInterests"> }
) {
  const offeror = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const interest = await ctx.db.get("internshipInterests", interestId);
  if (!interest) {
    throw new Error("Interest not found");
  }

  const internship = await ctx.db.get("internships", interest.internshipId);
  if (!internship || internship.offerorId !== offeror._id) {
    throw new Error("Interest not found");
  }

  if (interest.status !== "acknowledged") {
    await ctx.db.patch("internshipInterests", interestId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
    });

    // FR17: "Internship offeror should then respond through the app to
    // acknowledge. Further interaction shall not be on the app."
    await createNotification(ctx, {
      userId: interest.applicantId,
      type: "internship_interest_acknowledged",
      title: "Internship offeror responded",
      message: `${offeror.name} acknowledged your interest in the ${internship.role} internship. They'll be in touch using the contact details you have on file.`,
      href: "/internships",
    });
  }

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
        status: interest.status,
        createdAt: interest.createdAt,
        internshipRole: internship?.role ?? "Internship no longer available",
        internshipCompany: internship?.companyName ?? "",
        internshipStatus: internship
          ? await effectiveStatus(internship)
          : "closed",
      };
    })
  );
}

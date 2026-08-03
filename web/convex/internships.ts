import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import * as InternshipsModel from "./model/internships";
import {
  internshipAcceptanceContactMethodValidator,
  internshipStatusValidator,
} from "./model/internships/fields";

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_FILE_NAME_MAX = 255;
const CV_DEFINITIONS = {
  ".pdf": {
    contentType: "application/pdf",
    signature: [0x25, 0x50, 0x44, 0x46, 0x2d],
  },
  ".doc": {
    contentType: "application/msword",
    signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  },
  ".docx": {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
} as const;

function getCvDefinition(fileName: string) {
  const normalizedFileName = fileName.trim().split(/[\\/]/).pop() ?? "";
  if (
    normalizedFileName.length === 0 ||
    normalizedFileName.length > CV_FILE_NAME_MAX
  ) {
    throw new ConvexError(
      `CV file name must be between 1 and ${CV_FILE_NAME_MAX} characters.`
    );
  }

  const dotIndex = normalizedFileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    throw new ConvexError("CV must be a PDF, DOC, or DOCX file.");
  }
  const extension = normalizedFileName
    .slice(dotIndex)
    .toLowerCase() as keyof typeof CV_DEFINITIONS;
  const definition = CV_DEFINITIONS[extension];
  if (!definition) {
    throw new ConvexError("CV must be a PDF, DOC, or DOCX file.");
  }

  return { normalizedFileName, definition };
}

function startsWithSignature(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export const offer = mutation({
  args: {
    companyName: v.string(),
    role: v.string(),
    description: v.string(),
    startPeriod: v.string(),
    duration: v.string(),
    isPaid: v.boolean(),
    closingDate: v.number(),
    confirmedAuthority: v.boolean(),
  },
  handler: (ctx, args) => InternshipsModel.offer(ctx, args),
});

export const listOpen = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => InternshipsModel.listOpen(ctx, args),
});

export const getPosting = query({
  args: { internshipId: v.id("internships") },
  handler: (ctx, args) => InternshipsModel.getPosting(ctx, args),
});

export const myOffered = query({
  args: {},
  handler: (ctx) => InternshipsModel.myOffered(ctx),
});

export const updateStatus = mutation({
  args: {
    internshipId: v.id("internships"),
    status: internshipStatusValidator,
  },
  handler: (ctx, args) => InternshipsModel.updateStatus(ctx, args),
});

export const adminTakeDown = mutation({
  args: {
    internshipId: v.id("internships"),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) => InternshipsModel.adminTakeDown(ctx, args),
});

export const listActiveForAdmin = query({
  args: { search: v.optional(v.string()) },
  handler: (ctx, args) => InternshipsModel.listActiveForAdmin(ctx, args),
});

export const listTakenDownForAdmin = query({
  args: { search: v.optional(v.string()) },
  handler: (ctx, args) => InternshipsModel.listTakenDownForAdmin(ctx, args),
});

export const generateCvUploadUrl = mutation({
  args: {},
  handler: (ctx) => InternshipsModel.generateCvUploadUrl(ctx),
});

export const persistApplication = internalMutation({
  args: {
    internshipId: v.id("internships"),
    note: v.optional(v.string()),
    cvStorageId: v.id("_storage"),
    cvFileName: v.string(),
    cvContentType: v.string(),
    cvSize: v.number(),
  },
  handler: (ctx, args) => InternshipsModel.persistApplication(ctx, args),
});

export const deleteUnreferencedCvUpload = internalMutation({
  args: {
    cvStorageId: v.id("_storage"),
  },
  handler: (ctx, args) =>
    InternshipsModel.deleteUnreferencedCvUpload(ctx, args),
});

export const submitApplication = action({
  args: {
    internshipId: v.id("internships"),
    note: v.optional(v.string()),
    cvStorageId: v.id("_storage"),
    cvFileName: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"internshipInterests">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const cvBlob = await ctx.storage.get(args.cvStorageId);
    if (!cvBlob) {
      throw new ConvexError(
        "We couldn't find the uploaded CV. Please choose the file again and resubmit."
      );
    }

    try {
      const { normalizedFileName, definition } = getCvDefinition(
        args.cvFileName
      );
      if (cvBlob.size <= 0 || cvBlob.size > CV_MAX_BYTES) {
        throw new ConvexError(
          "CV must be a non-empty file no larger than 5 MiB."
        );
      }
      if (cvBlob.type !== definition.contentType) {
        throw new ConvexError(
          "CV file type does not match its extension. Upload a PDF, DOC, or DOCX file."
        );
      }

      // Read the whole file once and slice the resulting Uint8Array rather
      // than calling Blob#slice().arrayBuffer(): slicing a Blob before
      // reading it can throw "RangeError: offset is out of bounds" for some
      // storage-backed blobs in the action runtime. Working from a single
      // materialized buffer avoids that failure mode entirely.
      const fileBytes = new Uint8Array(await cvBlob.arrayBuffer());
      const signatureBytes = fileBytes.subarray(
        0,
        definition.signature.length
      );
      if (!startsWithSignature(signatureBytes, definition.signature)) {
        throw new ConvexError(
          "CV content does not match its file type. Upload a valid PDF, DOC, or DOCX file."
        );
      }

      return await ctx.runMutation(internal.internships.persistApplication, {
        internshipId: args.internshipId,
        note: args.note,
        cvStorageId: args.cvStorageId,
        cvFileName: normalizedFileName,
        cvContentType: definition.contentType,
        cvSize: cvBlob.size,
      });
    } catch (error) {
      // Never delete a storage object that a successful application already
      // references. The mutation makes the reference check and deletion
      // atomic relative to application persistence.
      await ctx.runMutation(
        internal.internships.deleteUnreferencedCvUpload,
        {
          cvStorageId: args.cvStorageId,
        }
      );
      if (error instanceof ConvexError) {
        throw error;
      }
      // Don't leak internal error details (stack traces, storage internals)
      // to the client. Log server-side for debugging and surface a generic,
      // friendly message instead.
      console.error("submitApplication failed unexpectedly", error);
      throw new ConvexError(
        "We couldn't submit your application. Please try again, and if the problem continues, try a different CV file."
      );
    }
  },
});

export const listInterestsForPosting = query({
  args: { internshipId: v.id("internships") },
  handler: (ctx, args) => InternshipsModel.listInterestsForPosting(ctx, args),
});

export const getApplicationForOwner = query({
  args: { interestId: v.id("internshipInterests") },
  handler: (ctx, args) => InternshipsModel.getApplicationForOwner(ctx, args),
});

export const decideApplication = mutation({
  args: {
    interestId: v.id("internshipInterests"),
    decision: v.union(v.literal("accepted"), v.literal("rejected")),
    message: v.optional(v.string()),
    contactMethod: v.optional(internshipAcceptanceContactMethodValidator),
    contactDetails: v.optional(v.string()),
    startArrangements: v.optional(v.string()),
  },
  handler: (ctx, args) => InternshipsModel.decideApplication(ctx, args),
});

export const myInterests = query({
  args: {},
  handler: (ctx) => InternshipsModel.myInterests(ctx),
});

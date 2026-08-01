"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowLeft, CheckCircle2, FileText, Loader2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_FILE_NAME_MAX = 255;
const CV_CONTENT_TYPE_BY_EXTENSION = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

/**
 * Convex actions/mutations throw a `ConvexError` for expected, user-facing
 * validation failures (e.g. wrong file type, not eligible to apply). Those
 * carry a friendly message in `.data` that's safe to show as-is. Anything
 * else is an unexpected server error - Convex already logs the details to
 * the console for debugging, so we only ever show the user a generic,
 * non-alarming message here and never let it crash the page or bubble up
 * as a Next.js error overlay.
 */
function getErrorMessage(error: unknown) {
  if (error instanceof ConvexError) {
    return typeof error.data === "string"
      ? error.data
      : "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function InternshipDetails({
  internshipId,
}: {
  internshipId: Id<"internships">;
}) {
  const internship = useQuery(api.internships.getPosting, { internshipId });
  const generateCvUploadUrl = useMutation(
    api.internships.generateCvUploadUrl
  );
  const submitApplication = useAction(api.internships.submitApplication);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (internship === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const applicationSent =
    submitted || internship.alreadyExpressedInterest;

  async function handleApply() {
    if (!cvFile) {
      setError("Attach your CV before submitting.");
      return;
    }

    const extension = cvFile.name.split(".").pop()?.toLowerCase();
    const expectedContentType =
      extension &&
      CV_CONTENT_TYPE_BY_EXTENSION[
        extension as keyof typeof CV_CONTENT_TYPE_BY_EXTENSION
      ];

    if (cvFile.name.length > CV_FILE_NAME_MAX) {
      setError(
        `CV file name is too long (max ${CV_FILE_NAME_MAX} characters). Rename the file and try again.`
      );
      return;
    }
    if (!expectedContentType) {
      setError("CV must be a PDF, DOC, or DOCX file.");
      return;
    }
    if (
      cvFile.type &&
      cvFile.type !== expectedContentType
    ) {
      setError("CV file type does not match its extension.");
      return;
    }
    if (cvFile.size <= 0 || cvFile.size > CV_MAX_BYTES) {
      setError("CV must be a non-empty file no larger than 5 MiB.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const uploadUrl = await generateCvUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": expectedContentType },
        body: cvFile,
      });
      if (!uploadResponse.ok) {
        throw new Error(
          "CV upload failed. Please check your connection and try again."
        );
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: Id<"_storage">;
      };
      await submitApplication({
        internshipId,
        note: note.trim() || undefined,
        cvStorageId: storageId,
        cvFileName: cvFile.name,
      });
      setSubmitted(true);
      setNote("");
      setCvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/internships">
          <ArrowLeft />
          Back to internships
        </Link>
      </Button>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{internship.role}</CardTitle>
              <CardDescription className="mt-2">
                {internship.companyName} · Offered by {internship.offerorName}
              </CardDescription>
            </div>
            <Badge variant={internship.isPaid ? "default" : "outline"}>
              {internship.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>
              Starts: {internship.startPeriod ?? "To be confirmed"}
            </span>
            <span>Duration: {internship.duration}</span>
            <span>Applications close {formatDate(internship.closingDate)}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold">About this internship</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {internship.description}
            </p>
          </div>

          <div className="border-t pt-5">
            {internship.isMine ? (
              <Badge variant="secondary">This is your posting</Badge>
            ) : applicationSent ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Application sent
              </span>
            ) : internship.isOpen ? (
              <div className="max-w-xl space-y-5">
                <div>
                  <h2 className="font-semibold">Apply for this internship</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Include an optional message and attach your CV. The
                    internship offeror will receive both with your application.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internship-application-message">
                    Message <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="internship-application-message"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Share why you're interested or add any useful context..."
                    disabled={isSubmitting}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {note.length}/1000
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internship-application-cv">
                    CV <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="internship-application-cv"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setCvFile(event.target.files?.[0] ?? null)
                    }
                  />
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    PDF, DOC, or DOCX · 5 MiB maximum
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApply}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Submit application
                </Button>
              </div>
            ) : (
              <Badge variant="outline">
                This posting is no longer accepting applications
              </Badge>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

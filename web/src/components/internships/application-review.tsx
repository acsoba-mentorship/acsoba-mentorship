"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";

type Decision = "accepted" | "rejected";
type ContactMethod = "email" | "phone" | "whatsapp" | "other";

const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  other: "Other",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatFileSize(bytes: number | null) {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ApplicationReview({
  interestId,
}: {
  interestId: Id<"internshipInterests">;
}) {
  const application = useQuery(api.internships.getApplicationForOwner, {
    interestId,
  });
  const decideApplication = useMutation(api.internships.decideApplication);
  const [decision, setDecision] = useState<Decision | "">("");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod | "">("");
  const [contactDetails, setContactDetails] = useState("");
  const [startArrangements, setStartArrangements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision() {
    if (!application || !decision) {
      setError("Choose whether to accept or reject this application.");
      return;
    }

    const normalizedMessage = message.trim();
    if (decision === "accepted") {
      if (!application.hasCv) {
        setError("Applications without a CV cannot be accepted.");
        return;
      }
      if (normalizedMessage.length < 20) {
        setError("Write an acceptance message of at least 20 characters.");
        return;
      }
      if (!contactMethod || contactDetails.trim().length < 3) {
        setError("Choose a contact method and provide contact details.");
        return;
      }
      if (startArrangements.trim().length < 10) {
        setError("Provide the applicant's start arrangements.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await decideApplication({
        interestId,
        decision,
        message: normalizedMessage || undefined,
        contactMethod: contactMethod || undefined,
        contactDetails: contactDetails.trim() || undefined,
        startArrangements: startArrangements.trim() || undefined,
      });
      setDecision("");
      setMessage("");
      setContactMethod("");
      setContactDetails("");
      setStartArrangements("");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (application === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-[32rem] w-full rounded-lg" />
      </div>
    );
  }

  const hasDecision =
    application.status === "accepted" || application.status === "rejected";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/internships?tab=my-postings">
          <ArrowLeft />
          Back to internships
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Internship application</CardTitle>
              <CardDescription className="mt-2">
                Review the submission for {application.internshipRole}.
              </CardDescription>
            </div>
            {application.status === "accepted" ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                Accepted
              </Badge>
            ) : application.status === "rejected" ? (
              <Badge variant="destructive">Rejected</Badge>
            ) : (
              <Badge variant="secondary">Awaiting decision</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="rounded-lg border bg-muted/40 p-4">
            <p className="font-semibold">{application.applicantName}</p>
            <p className="text-xs text-muted-foreground">
              Applied {formatDateTime(application.createdAt)}
            </p>

            <div className="mt-3 space-y-1.5 text-sm">
              {application.applicantEmail ? (
                <a
                  className="flex items-center gap-2 hover:underline"
                  href={`mailto:${application.applicantEmail}`}
                >
                  <Mail className="size-4 text-muted-foreground" />
                  {application.applicantEmail}
                </a>
              ) : null}
              {application.applicantPhoneNumber ? (
                <a
                  className="flex items-center gap-2 hover:underline"
                  href={`tel:${application.applicantPhoneNumber}`}
                >
                  <Phone className="size-4 text-muted-foreground" />
                  {application.applicantPhoneNumber}
                </a>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Applicant message</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {application.note || "No message was included."}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Curriculum vitae</h2>
            {application.cvDownloadUrl ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  {application.cvFileName || "Applicant CV"}
                  {application.cvSize !== null
                    ? ` · ${formatFileSize(application.cvSize)}`
                    : ""}
                </span>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={application.cvDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download />
                    Download CV
                  </a>
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No CV is attached to this legacy application.
              </p>
            )}
          </section>

          {!hasDecision && !application.hasCv ? (
            <Alert>
              <AlertDescription>
                This legacy application has no CV. It can be rejected, but it
                cannot be accepted.
              </AlertDescription>
            </Alert>
          ) : null}

          {hasDecision ? (
            <section className="rounded-lg border p-4">
              <p className="inline-flex items-center gap-2 font-medium">
                {application.status === "accepted" ? (
                  <CheckCircle2 className="size-4 text-emerald-700" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}
                Application {application.status}
              </p>
              {application.status === "accepted" ? (
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      Posting start period
                    </dt>
                    <dd>
                      {application.internshipStartPeriod ?? "To be confirmed"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      Contact method
                    </dt>
                    <dd>
                      {application.acceptanceContactMethod
                        ? CONTACT_METHOD_LABELS[
                            application.acceptanceContactMethod
                          ]
                        : "Not recorded"}
                      {application.acceptanceContactDetails
                        ? ` · ${application.acceptanceContactDetails}`
                        : ""}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground">
                      Start arrangements
                    </dt>
                    <dd className="whitespace-pre-wrap">
                      {application.acceptanceStartArrangements ??
                        "Not recorded"}
                    </dd>
                  </div>
                </dl>
              ) : null}
              {application.decisionMessage ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Decision message
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {application.decisionMessage}
                  </p>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="space-y-4 border-t pt-5">
              <div className="space-y-2">
                <Label htmlFor="internship-application-decision">
                  Decision
                </Label>
                <Select
                  value={decision}
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    setDecision(value as Decision);
                    setError(null);
                  }}
                >
                  <SelectTrigger id="internship-application-decision">
                    <SelectValue placeholder="Choose a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="accepted"
                      disabled={!application.hasCv}
                    >
                      Accept
                    </SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {decision === "accepted" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="internship-contact-method">
                        Contact method
                      </Label>
                      <Select
                        value={contactMethod}
                        disabled={isSubmitting}
                        onValueChange={(value) =>
                          setContactMethod(value as ContactMethod)
                        }
                      >
                        <SelectTrigger id="internship-contact-method">
                          <SelectValue placeholder="Choose a method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internship-contact-details">
                        Contact details
                      </Label>
                      <Input
                        id="internship-contact-details"
                        value={contactDetails}
                        onChange={(event) =>
                          setContactDetails(event.target.value)
                        }
                        maxLength={300}
                        disabled={isSubmitting}
                        placeholder="Email, number, or clear contact instructions"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internship-start-arrangements">
                      Start arrangements
                    </Label>
                    <Textarea
                      id="internship-start-arrangements"
                      value={startArrangements}
                      onChange={(event) =>
                        setStartArrangements(event.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      disabled={isSubmitting}
                      placeholder="Confirm timing, location, and the next step before starting..."
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {startArrangements.length}/500
                    </p>
                  </div>
                </>
              ) : null}

              {decision ? (
                <div className="space-y-2">
                  <Label htmlFor="internship-decision-message">
                    {decision === "accepted"
                      ? "Acceptance message"
                      : "Rejection message (optional)"}
                  </Label>
                  <Textarea
                    id="internship-decision-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    minLength={decision === "accepted" ? 20 : undefined}
                    maxLength={decision === "accepted" ? 500 : 2000}
                    disabled={isSubmitting}
                    placeholder={
                      decision === "accepted"
                        ? "Write a meaningful welcome and next-steps message..."
                        : "Optionally explain the decision..."
                    }
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {message.length}/{decision === "accepted" ? 500 : 2000}
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        {!hasDecision ? (
          <CardFooter className="justify-end">
            <Button
              type="button"
              variant={decision === "rejected" ? "destructive" : "default"}
              disabled={isSubmitting || !decision}
              onClick={handleDecision}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {decision === "accepted"
                ? "Accept application"
                : decision === "rejected"
                  ? "Reject application"
                  : "Choose a decision"}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

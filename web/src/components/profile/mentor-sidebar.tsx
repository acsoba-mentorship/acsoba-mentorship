"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Code,
  Building,
  GraduationCap,
  Pencil,
  HandshakeIcon,
  ArrowRight,
} from "lucide-react";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import { publicUserToMentorProfileDto, type PublicUserProfile } from "@/lib/types";
import { SendRequestDialog } from "@/components/requests/send-request-dialog";
import { useLatestRequestStatusByMentor } from "@/hooks/use-latest-request-status-by-mentor";
import { ProfileSectionCard } from "./profile-section-card";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { MentorDetailsForm } from "./forms/mentor-details-form";
import { MentorExpertiseForm } from "./forms/mentor-expertise-form";

interface MentorSidebarProps {
  user: PublicUserProfile;
  isOwnProfile?: boolean;
}

export function MentorSidebar({ user, isOwnProfile = false }: MentorSidebarProps) {
  const profile = user?.mentorProfile;
  const firstName = user.name?.split(" ")[0] ?? user.name;
  const [mentorshipDetailsOpen, setMentorshipDetailsOpen] = useState(false);
  const [expertiseOpen, setExpertiseOpen] = useState(false);
  const { currentUserId, hasMenteeProfile, getLatestStatus, latestRequestStatusLoading } =
    useLatestRequestStatusByMentor();
  const mentorForRequest = publicUserToMentorProfileDto(user);

  return (
    <div className="space-y-4">

      {/* ── Unified "Connect with" card — same for own and visitor profiles ── */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-semibold tracking-wide">
                Connect with {firstName}
              </CardTitle>
              {isOwnProfile && (
                <ProfileEditDialog
                  open={mentorshipDetailsOpen}
                  onOpenChange={setMentorshipDetailsOpen}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Mentorship Details">
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                  title="Edit Mentorship Details"
                  description="Update availability, max mentees, and years of experience."
                >
                  <MentorDetailsForm
                    user={user}
                    onSuccess={() => setMentorshipDetailsOpen(false)}
                  />
                </ProfileEditDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Experience
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {profile.yearsOfExperience != null
                    ? `${profile.yearsOfExperience} yr${profile.yearsOfExperience === 1 ? "" : "s"}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Mentees
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {profile.maxMentees != null ? `${profile.maxMentees} max` : "—"}
                </p>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Availability</span>
              <Badge
                className={`text-xs border-0 ${profile.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}
              >
                {profile.isAvailable ? AVAILABLE : UNAVAILABLE}
              </Badge>
            </div>

            {/* CTA — only for visitor */}
            {!isOwnProfile && mentorForRequest && (
              <>
                <Separator />
                <SendRequestDialog
                  mentor={mentorForRequest}
                  currentUserId={currentUserId}
                  hasMenteeProfile={hasMenteeProfile}
                  latestStatus={getLatestStatus(user.userId)}
                  latestStatusLoading={latestRequestStatusLoading}
                  buttonClassName="w-full"
                  sendRequestLabel="Request Mentorship"
                  triggerStart={<HandshakeIcon className="size-3.5" />}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Expertise & Industries ── */}
      <ProfileSectionCard
        title="Expertise & Industries"
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            open={expertiseOpen}
            onOpenChange={setExpertiseOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Expertise & Industries">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Expertise & Industries"
            description="Add your areas of expertise and industries."
          >
            <MentorExpertiseForm
              user={user}
              onSuccess={() => setExpertiseOpen(false)}
            />
          </ProfileEditDialog>
        }
      >
        {profile &&
        (profile.expertise.length > 0 || (user.industries?.length ?? 0) > 0) ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="size-3.5 text-primary/50" />
                <span className="text-sm font-semibold">Expertise</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.expertise.length > 0 ? (
                  profile.expertise.map((expertise) => (
                    <Badge key={expertise} variant="secondary" className="text-xs">
                      {expertise}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No expertise added yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="size-3.5 text-primary/50" />
                <span className="text-sm font-semibold">Industries</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(user.industries?.length ?? 0) > 0 ? (
                  user.industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No industries added yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No expertise or industries added yet.</p>
        )}
      </ProfileSectionCard>

      {/* ── Navy Mentor Panel banner — own profile only ── */}
      {isOwnProfile && (
        <div className="relative overflow-hidden rounded-xl bg-primary px-6 py-5">
          {/* Watermark icon */}
          <GraduationCap
            className="absolute -right-3 -bottom-3 size-28 text-primary-foreground opacity-[0.07]"
            aria-hidden="true"
          />

          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/60">
            Mentor Panel
          </p>
          <p className="mt-2 text-lg font-bold text-primary-foreground leading-snug">
            Manage Your Mentorships
          </p>
          <p className="mt-1 text-xs text-primary-foreground/60">
            Review requests, active mentorships, and settings.
          </p>

          <Link
            href="/mentor"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            Go to Panel
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

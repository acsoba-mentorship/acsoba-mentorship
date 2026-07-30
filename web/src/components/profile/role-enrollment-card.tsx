import Link from "next/link";
import { ArrowRight, GraduationCap, Handshake } from "lucide-react";
import type { PublicUserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RoleEnrollmentCard({ user }: { user: PublicUserProfile }) {
  if (user.mentorProfile && user.menteeProfile) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Take part in both roles</CardTitle>
        <CardDescription>
          Mentees can add a mentor profile, and mentors can add a mentee
          profile. Your verified account details carry across.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!user.mentorProfile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-semibold">Share your experience</p>
                <p className="text-sm text-muted-foreground">
                  Add a mentor profile and become discoverable to mentees.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/profile/add-mentor">
                Add mentor profile
                <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Handshake className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-semibold">Find guidance</p>
                <p className="text-sm text-muted-foreground">
                  Add a mentee profile and start connecting with mentors.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/profile/add-mentee">
                Add mentee profile
                <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

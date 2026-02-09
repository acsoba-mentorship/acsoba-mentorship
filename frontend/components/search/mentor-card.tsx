"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { UserWithProfiles } from "@/lib/types";
import { CheckCircle, Clock } from "lucide-react";

interface MentorCardProps {
  mentor: UserWithProfiles;
  onSendRequest?: () => void;
}

export function MentorCard({ mentor, onSendRequest }: MentorCardProps) {
  const mentorProfile = mentor.mentorProfile;
  const initials = `${mentor.firstName[0]}${mentor.lastName[0]}`;
  const isAvailable =
    mentorProfile && mentorProfile.currentMenteeCount < mentorProfile.maxMentees;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={mentor.avatarUrl}
              alt={`${mentor.firstName} ${mentor.lastName}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-tight">
                <Link
                  href={`/profile?userId=${mentor.id}&role=mentor`}
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {mentor.firstName} {mentor.lastName}
                </Link>
              </h3>
              {mentor.isVerifiedMentor && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </div>
            {mentor.title && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mentor.title}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{mentorProfile?.yearsOfExperience ?? 0} years experience</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {mentorProfile?.expertise.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {mentorProfile && mentorProfile.expertise.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{mentorProfile.expertise.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button
          className="w-full"
          variant={isAvailable ? "default" : "secondary"}
          disabled={!isAvailable}
          onClick={onSendRequest}
        >
          {isAvailable ? "Send Request" : "Not Available"}
        </Button>
      </CardFooter>
    </Card>
  );
}

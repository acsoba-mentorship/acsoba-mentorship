"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserWithProfiles } from "@/lib/types";
import { CheckCircle, Clock, MapPin, Calendar } from "lucide-react";

interface MentorListItemProps {
  mentor: UserWithProfiles;
  onSendRequest?: () => void;
}

export function MentorListItem({ mentor, onSendRequest }: MentorListItemProps) {
  const mentorProfile = mentor.mentorProfile;
  const initials = `${mentor.firstName[0]}${mentor.lastName[0]}`;
  const isAvailable =
    mentorProfile && mentorProfile.currentMenteeCount < mentorProfile.maxMentees;

  return (
    <div className="flex gap-4 rounded-lg border bg-white p-4 dark:bg-gray-900">
      <Avatar className="h-16 w-16 shrink-0">
        <AvatarImage
          src={mentor.avatarUrl}
          alt={`${mentor.firstName} ${mentor.lastName}`}
        />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">
            <Link
              href={`/profile?userId=${mentor.id}&role=mentor`}
              rel="noreferrer"
              className="hover:text-primary hover:underline"
            >
              {mentor.firstName} {mentor.lastName}
            </Link>
          </h3>
          {mentor.isVerifiedMentor && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {!isAvailable && (
            <Badge variant="outline" className="text-orange-600">
              Not Available
            </Badge>
          )}
        </div>

        {mentor.title && (
          <p className="font-medium text-gray-700 dark:text-gray-300">
            {mentor.title}
          </p>
        )}

        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {mentor.mentorProfile?.bio}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {mentor.mentorProfile?.yearsOfExperience ?? 0} years experience
          </span>
          {mentor.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {mentor.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {mentor.mentorProfile?.availability}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          {mentor.mentorProfile?.expertise.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0">
        <Button
          variant={isAvailable ? "default" : "secondary"}
          disabled={!isAvailable}
          onClick={onSendRequest}
        >
          {isAvailable ? "Send Request" : "Unavailable"}
        </Button>
      </div>
    </div>
  );
}

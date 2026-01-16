"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MentorWithUser } from "@/lib/types";
import { CheckCircle, Clock, MapPin, Calendar } from "lucide-react";

interface MentorListItemProps {
  mentor: MentorWithUser;
  onSendRequest?: () => void;
}

export function MentorListItem({ mentor, onSendRequest }: MentorListItemProps) {
  const initials = `${mentor.user.firstName[0]}${mentor.user.lastName[0]}`;
  const isAvailable = mentor.currentMenteeCount < mentor.maxMentees;

  return (
    <div className="flex gap-4 rounded-lg border bg-white p-4 dark:bg-gray-900">
      <Avatar className="h-16 w-16 shrink-0">
        <AvatarImage
          src={mentor.user.avatarUrl}
          alt={`${mentor.user.firstName} ${mentor.user.lastName}`}
        />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">
            {mentor.user.firstName} {mentor.user.lastName}
          </h3>
          {mentor.user.isVerifiedMentor && (
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

        {mentor.user.title && (
          <p className="font-medium text-gray-700 dark:text-gray-300">
            {mentor.user.title}
          </p>
        )}

        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {mentor.bio}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {mentor.yearsOfExperience} years experience
          </span>
          {mentor.user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {mentor.user.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {mentor.availability}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          {mentor.expertise.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center">
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

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MentorWithUser } from "@/lib/types";
import { CheckCircle, Clock } from "lucide-react";

interface MentorCardProps {
  mentor: MentorWithUser;
  onSendRequest?: () => void;
}

export function MentorCard({ mentor, onSendRequest }: MentorCardProps) {
  const initials = `${mentor.user.firstName[0]}${mentor.user.lastName[0]}`;
  const isAvailable = mentor.currentMenteeCount < mentor.maxMentees;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={mentor.user.avatarUrl}
              alt={`${mentor.user.firstName} ${mentor.user.lastName}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-tight">
                {mentor.user.firstName} {mentor.user.lastName}
              </h3>
              {mentor.user.isVerifiedMentor && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </div>
            {mentor.user.title && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mentor.user.title}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{mentor.yearsOfExperience} years experience</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {mentor.expertise.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {mentor.expertise.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{mentor.expertise.length - 3}
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

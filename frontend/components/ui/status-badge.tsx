"use client";

import { Clock, CheckCircle, XCircle, Pause, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RequestStatus,
  MentorshipStatus,
  requestStatusColors,
  mentorshipStatusColors,
  getStatusLabel,
} from "@/lib/status";

/**
 * Icon components for request statuses
 */
const requestStatusIcons: Record<RequestStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  accepted: <CheckCircle className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

/**
 * Icon components for mentorship statuses
 */
const mentorshipStatusIcons: Record<MentorshipStatus, React.ReactNode> = {
  active: <Circle className="h-4 w-4 text-green-500 fill-green-500" />,
  paused: <Pause className="h-4 w-4 text-yellow-500" />,
  completed: <CheckCircle className="h-4 w-4 text-gray-500" />,
};

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  status: RequestStatus | MentorshipStatus;
  type?: "request" | "mentorship";
  showIcon?: boolean;
  className?: string;
}

/**
 * Reusable status badge component that handles both request and mentorship statuses.
 * Displays appropriate colors and optional icons.
 * 
 * @example
 * // Request status badge
 * <StatusBadge status="pending" type="request" />
 * 
 * @example
 * // Mentorship status badge without icon
 * <StatusBadge status="active" type="mentorship" showIcon={false} />
 */
export function StatusBadge({
  status,
  type = "request",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const colors =
    type === "request"
      ? requestStatusColors[status as RequestStatus]
      : mentorshipStatusColors[status as MentorshipStatus];

  const icon =
    type === "request"
      ? requestStatusIcons[status as RequestStatus]
      : mentorshipStatusIcons[status as MentorshipStatus];

  return (
    <Badge className={cn(colors, className)}>
      <span className="flex items-center gap-1">
        {showIcon && icon}
        {getStatusLabel(status)}
      </span>
    </Badge>
  );
}

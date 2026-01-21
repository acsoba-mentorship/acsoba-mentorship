/**
 * Status types and constants for requests and mentorships.
 * Used by StatusBadge component and throughout the app.
 */

/**
 * Request status types
 */
export type RequestStatus = "pending" | "accepted" | "rejected";

/**
 * Mentorship status types
 */
export type MentorshipStatus = "active" | "paused" | "completed";

/**
 * Color classes for request statuses
 */
export const requestStatusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

/**
 * Color classes for mentorship statuses
 */
export const mentorshipStatusColors: Record<MentorshipStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * Get display label for a status (capitalizes first letter)
 */
export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

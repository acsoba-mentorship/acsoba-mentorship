import { redirect } from "next/navigation";

/**
 * Mentorship requests now live inside the "Requests" tab of Mentorships.
 * Keep this route around (bookmarks, old links) but forward to the new
 * location.
 */
export default function MentorRequestsRedirectPage() {
  redirect("/mentor/mentorships?tab=requests");
}

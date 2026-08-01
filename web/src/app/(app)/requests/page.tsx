import { redirect } from "next/navigation";

/**
 * Mentorship requests now live inside the "Requests" tab of My Mentorships.
 * Keep this route around (bookmarks, old links) but forward to the new
 * location.
 */
export default function MenteeRequestsRedirectPage() {
  redirect("/mentorships?tab=requests");
}

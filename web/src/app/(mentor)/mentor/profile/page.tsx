"use client";

import { redirect } from "next/navigation";

export default function MentorProfilePage(): React.ReactNode {
  redirect("/profile?role=mentor");
  return null;
}

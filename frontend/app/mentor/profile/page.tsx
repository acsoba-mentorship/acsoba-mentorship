"use client";

import { redirect } from "next/navigation";

export default function MentorProfilePage() {
  redirect("/profile?role=mentor");
}


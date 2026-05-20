"use client";

import { redirect } from "next/navigation";

export function RedirectToLanding(): React.ReactNode {
  redirect("/");
  return null;
}

export function RedirectToDashboard(): React.ReactNode {
  redirect("/dashboard");
  return null;
}
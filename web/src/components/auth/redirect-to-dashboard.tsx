    "use client";

import { redirect } from "next/navigation";

export function RedirectToDashboard(): React.ReactNode {
  redirect("/dashboard");
  return null;
}

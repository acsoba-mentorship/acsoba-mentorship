"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RedirectToLanding() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}

export function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}

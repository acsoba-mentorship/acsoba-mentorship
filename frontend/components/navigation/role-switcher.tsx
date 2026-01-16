"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

export function RoleSwitcher() {
  const pathname = usePathname();
  const isMentorView = pathname.startsWith("/mentor");
  const isMenteeView = pathname.startsWith("/mentee");

  if (!isMentorView && !isMenteeView) {
    return null;
  }

  const switchTo = isMentorView ? "/mentee" : "/mentor";
  const switchLabel = isMentorView ? "Switch to Mentee" : "Switch to Mentor";

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={switchTo} className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4" />
        {switchLabel}
      </Link>
    </Button>
  );
}

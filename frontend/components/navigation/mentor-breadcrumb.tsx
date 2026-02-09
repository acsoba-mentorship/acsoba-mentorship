"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { capitalize } from "@/lib/utils";

// Custom labels for routes that need special formatting
const routeLabels: Record<string, string> = {
  "/mentor": "Dashboard",
};

// Routes that should not be shown in breadcrumb (non-navigable parent routes)
const hiddenRoutes = new Set([
  "/mentor/mentees", // Only individual mentee profiles are accessible
]);

export function MentorBreadcrumb() {
  const pathname = usePathname();

  // If we're on the main dashboard page, don't render breadcrumb
  if (pathname === "/mentor") {
    return null;
  }

  // Build path progressively with segments
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems: Array<{ href: string; label: string; isLast: boolean }> = [];
  
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    
    // Skip hidden routes (non-navigable parent routes)
    if (hiddenRoutes.has(currentPath)) {
      continue;
    }
    
    // Use routeLabels if available, otherwise capitalize the segment
    const label = routeLabels[currentPath] || capitalize(segments[i]);
    
    breadcrumbItems.push({
      href: currentPath,
      label,
      isLast,
    });
  }

  // Recalculate isLast after filtering
  if (breadcrumbItems.length > 0) {
    breadcrumbItems.forEach((item, index) => {
      item.isLast = index === breadcrumbItems.length - 1;
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

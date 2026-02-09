"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  User,
  Users,
  Inbox,
  Home,
} from "lucide-react";

const mentorNavItems = [
  {
    href: "/mentor",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/profile?role=mentor",
    label: "Profile",
    icon: User,
  },
  {
    href: "/mentor/mentorships",
    label: "Mentorships",
    icon: Users,
  },
  {
    href: "/mentor/requests",
    label: "Requests",
    icon: Inbox,
  },
];

export function MentorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-64 flex-col border-r bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between border-b p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5" />
          <span>Mentorship</span>
        </Link>
      </div>

      <div className="flex-1 space-y-1 p-4">
        {mentorNavItems.map((item) => {
          const itemPath = item.href.split("?")[0];
          const isActive =
            pathname === itemPath ||
            (itemPath !== "/mentor" && pathname.startsWith(itemPath));
          const Icon = item.icon;

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </nav>
  );
}

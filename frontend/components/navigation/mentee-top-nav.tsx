"use client";

import Link from "next/link";
import { NavLink } from "./nav-link";
import { ProfileDropdown } from "./profile-dropdown";
import { currentUser } from "@/lib/dummy-data";
import { GraduationCap } from "lucide-react";

const mainNavItems = [
  {
    href: "/mentee",
    label: "Explore",
    exactMatch: true,
  },
  {
    href: "/mentee/search",
    label: "Find Mentors",
  },
];

export function MenteeTopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <GraduationCap className="h-6 w-6" />
          <span className="hidden sm:inline-block">Mentorship</span>
        </Link>

        {/* Right side: Navigation + Avatar */}
        <div className="flex items-center gap-6">
          {/* Main Navigation - Hidden on mobile */}
          <nav className="hidden items-center gap-1 md:flex">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                exactMatch={item.exactMatch}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Profile Dropdown */}
          <ProfileDropdown user={currentUser} navItems={mainNavItems} />
        </div>
      </div>
    </header>
  );
}

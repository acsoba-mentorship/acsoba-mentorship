"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/types";
import {
  User as UserIcon,
  Send,
  Users,
  Calendar,
  Settings,
  ArrowLeftRight,
  LogOut,
  Compass,
  Search,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  exactMatch?: boolean;
}

interface ProfileDropdownProps {
  user: User;
  showMentorSwitch?: boolean;
  navItems?: NavItem[];
}

export function ProfileDropdown({ 
  user, 
  showMentorSwitch = true,
  navItems = [],
}: ProfileDropdownProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  // Icons for mobile nav items
  const navIcons: Record<string, React.ReactNode> = {
    "/": <Compass className="mr-2 h-4 w-4" />,
    "/search": <Search className="mr-2 h-4 w-4" />,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-base font-medium">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Mobile Navigation - Only visible on mobile */}
        {navItems.length > 0 && (
          <>
            <DropdownMenuGroup className="md:hidden">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center cursor-pointer">
                    {navIcons[item.href]}
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="md:hidden" />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/requests" className="flex items-center cursor-pointer">
              <Send className="mr-2 h-4 w-4" />
              <span>My Requests</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/mentorships" className="flex items-center cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Mentorships</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/schedule" className="flex items-center cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Schedule</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {showMentorSwitch && user.isVerifiedMentor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/mentor" className="flex items-center cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Mentor Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

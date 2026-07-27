"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import {
  CalendarDays,
  Briefcase,
  Flag,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationMenu } from "@/components/navigation/notification-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";

function NavLinks({
  pathname,
  links,
}: {
  pathname: string;
  links: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }[];
}) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary-foreground",
            pathname === link.href
              ? "text-primary-foreground"
              : "text-primary-foreground/60"
          )}
        >
          <link.icon className="size-4" />
          {link.label}
        </Link>
      ))}
    </>
  );
}

function MobileNavLinks({
  pathname,
  links,
}: {
  pathname: string;
  links: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }[];
}) {
  return (
    <nav className="flex flex-col gap-3 pt-4">
      {links.map((link) => (
        <SheetClose key={link.href} asChild>
          <Link
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        </SheetClose>
      ))}
    </nav>
  );
}

function UserMenu({ hasAdminAccess }: { hasAdminAccess: boolean }) {
  const { user, logout } = useAuth0();
  const { currentUser } = useCurrentUser();

  const initials = user?.name ? getInitials(user.name) : "U";

  const handleLogout = () => {
    void logout({
      logoutParams: {
        returnTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
          <Avatar size="sm">
            <AvatarImage src={user?.picture ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground leading-none">
              {user?.email ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        {currentUser?.menteeProfile && (
          <DropdownMenuItem asChild>
            <Link href="/requests">
              <Inbox />
              My Requests
            </Link>
          </DropdownMenuItem>
        )}
        {currentUser?.mentorProfile && (
          <DropdownMenuItem asChild>
            <Link href="/mentor">
              <Shield />
              Mentor Panel
            </Link>
          </DropdownMenuItem>
        )}
        {hasAdminAccess && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck />
              Programme Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/report-incident">
            <Flag />
            Report an Incident
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthButtons() {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
        onClick={() => {
          if (!isLoading) void loginWithRedirect();
        }}
      >
        Log in
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          if (!isLoading)
            void loginWithRedirect({
              authorizationParams: { screen_hint: "signup" },
            });
        }}
      >
        Sign up
      </Button>
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useCurrentUser();
  const adminAccess = useQuery(
    api.admin.getMyAccess,
    isAuthenticated ? {} : "skip"
  );

  const appNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/search", label: "Find Mentors", icon: Search },
    { href: "/internships", label: "Internships", icon: Briefcase },
    ...(currentUser?.menteeProfile
      ? [
          { href: "/mentorships", label: "My Mentorships", icon: Users },
          { href: "/requests", label: "My Requests", icon: Inbox },
          { href: "/mentorships/timeline", label: "Timeline", icon: CalendarDays },
        ]
      : []),
    { href: "/report-incident", label: "Report Incident", icon: Flag },
    { href: "/profile", label: "Profile", icon: User },
    ...(adminAccess
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  const logoNavLink = isAuthenticated ? "/dashboard" : "/";

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/mentorships") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/report-incident") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/internships") ||
    pathname.startsWith("/profile");

  return (
    <header className="sticky top-0 z-50 w-full bg-primary">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="mr-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>
                <Link href="/" className="font-bold">
                  ACS OBA Shepherds
                </Link>
              </SheetTitle>
            </SheetHeader>
            {isAppRoute && <MobileNavLinks pathname={pathname} links={appNavLinks} />}
            <div className="mt-auto pb-4 px-3">
              <Unauthenticated>
                <AuthButtons />
              </Unauthenticated>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href={logoNavLink} className="mr-6 flex items-center gap-2 font-bold text-primary-foreground">
          ACS OBA Shepherds
        </Link>

        {/* Desktop nav links (only on app routes) */}
        {isAppRoute && (
          <nav className="hidden items-center gap-6 md:flex">
            <NavLinks pathname={pathname} links={appNavLinks} />
          </nav>
        )}

        {/* Right side: auth state */}
        <div className="ml-auto flex items-center gap-2">
          <AuthLoading>
            <Skeleton className="h-8 w-8 rounded-full" />
          </AuthLoading>
          <Authenticated>
            <NotificationMenu inverted />
            <UserMenu hasAdminAccess={Boolean(adminAccess)} />
          </Authenticated>
          <Unauthenticated>
            <div className="hidden md:flex">
              <AuthButtons />
            </div>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}

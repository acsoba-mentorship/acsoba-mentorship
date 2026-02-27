"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const appNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Find Mentors", icon: Search },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {appNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground",
            pathname === link.href
              ? "text-foreground"
              : "text-muted-foreground"
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
}: {
  pathname: string;
}) {
  return (
    <nav className="flex flex-col gap-3 pt-4">
      {appNavLinks.map((link) => (
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

function UserMenu() {
  const { user, logout } = useAuth0();

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
        <Button variant="ghost" size="icon" className="rounded-full">
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
        <DropdownMenuItem asChild>
          <Link href="/mentor">
            <Shield />
            Mentor Panel
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
        onClick={() => {
          if (!isLoading) void loginWithRedirect();
        }}
      >
        Log in
      </Button>
      <Button
        size="sm"
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

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/profile");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="mr-2 md:hidden">
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
            {isAppRoute && <MobileNavLinks pathname={pathname} />}
            <div className="mt-auto pb-4 px-3">
              <Unauthenticated>
                <AuthButtons />
              </Unauthenticated>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold">
          ACS OBA Shepherds
        </Link>

        {/* Desktop nav links (only on app routes) */}
        {isAppRoute && (
          <nav className="hidden items-center gap-6 md:flex">
            <NavLinks pathname={pathname} />
          </nav>
        )}

        {/* Right side: auth state */}
        <div className="ml-auto flex items-center gap-2">
          <AuthLoading>
            <Skeleton className="h-8 w-8 rounded-full" />
          </AuthLoading>
          <Authenticated>
            <UserMenu />
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

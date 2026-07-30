"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  LayoutDashboard,
  Inbox,
  Users,
  UserCog,
  ShieldCheck,
  Menu,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { NotificationMenu } from "@/components/navigation/notification-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mentorNavLinks = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/requests", label: "Requests", icon: Inbox },
  { href: "/mentor/mentorships", label: "Mentorships", icon: Users },
  { href: "/mentor/mentorships/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/profile", label: "Mentor Profile", icon: UserCog },
  { href: "/report-incident", label: "Report Incident", icon: Flag },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/mentor") return pathname === "/mentor";
  return pathname.startsWith(href);
}

function DesktopSidebar({
  pathname,
  hasAdminAccess,
}: {
  pathname: string;
  hasAdminAccess: boolean;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 p-6">
          <div>
            <h2 className="text-lg font-semibold">Mentor Panel</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your mentorship activities
            </p>
          </div>
          <NotificationMenu />
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-3">
          {mentorNavLinks.map((link) => (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(pathname, link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <link.icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="md:hidden">
                {link.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <Separator />

        <div className="p-3">
          {hasAdminAccess && (
            <Link
              href="/admin"
              className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShieldCheck className="size-4 shrink-0" />
              Programme Admin
            </Link>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back to App
          </Link>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebarTrigger({
  pathname,
  hasAdminAccess,
}: {
  pathname: string;
  hasAdminAccess: boolean;
}) {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Menu className="size-5" />
            <span className="sr-only">Toggle mentor menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>Mentor Panel</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 pt-4">
            {mentorNavLinks.map((link) => (
              <SheetClose key={link.href} asChild>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(pathname, link.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <link.icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <Separator className="my-3" />
          {hasAdminAccess && (
            <SheetClose asChild>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ShieldCheck className="size-4 shrink-0" />
                Programme Admin
              </Link>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              Back to App
            </Link>
          </SheetClose>
        </SheetContent>
      </Sheet>
      <span className="ml-3 text-sm font-semibold">Mentor Panel</span>
      <div className="ml-auto">
        <NotificationMenu />
      </div>
    </div>
  );
}

export function MentorNav() {
  const pathname = usePathname();
  const adminAccess = useQuery(api.admin.getMyAccess);
  const hasAdminAccess = Boolean(adminAccess);

  return (
    <>
      <DesktopSidebar
        pathname={pathname}
        hasAdminAccess={hasAdminAccess}
      />
      <MobileSidebarTrigger
        pathname={pathname}
        hasAdminAccess={hasAdminAccess}
      />
    </>
  );
}

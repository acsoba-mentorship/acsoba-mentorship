"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Inbox,
  Users,
  UserCog,
  Settings,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  { href: "/mentor/profile", label: "Mentor Profile", icon: UserCog },
  { href: "/mentor/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/mentor") return pathname === "/mentor";
  return pathname.startsWith(href);
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Mentor Panel</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your mentorship activities
          </p>
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

function MobileSidebarTrigger({ pathname }: { pathname: string }) {
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
    </div>
  );
}

export function MentorNav() {
  const pathname = usePathname();

  return (
    <>
      <DesktopSidebar pathname={pathname} />
      <MobileSidebarTrigger pathname={pathname} />
    </>
  );
}

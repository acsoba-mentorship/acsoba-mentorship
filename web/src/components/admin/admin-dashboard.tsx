"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowLeft,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  ScrollText,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { AdminManagementSection } from "@/components/admin/admin-management-section";
import { AuditLogSection } from "@/components/admin/audit-log-section";
import { ExitFeedbackSection } from "@/components/admin/exit-feedback-section";
import { IncidentReviewSection } from "@/components/admin/incident-review-section";
import { OutstandingFormsSection } from "@/components/admin/outstanding-forms-section";
import { OverviewSection } from "@/components/admin/overview-section";
import { ProgrammeSettingsSection } from "@/components/admin/programme-settings-section";
import { PulseSurveysSection } from "@/components/admin/pulse-surveys-section";
import { AdminStatusBadge } from "@/components/admin/admin-shared";
import { NotificationMenu } from "@/components/navigation/notification-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AdminAccess = NonNullable<
  FunctionReturnType<typeof api.admin.getMyAccess>
>;

type AdminSection =
  | "overview"
  | "forms"
  | "pulse"
  | "exit"
  | "incidents"
  | "settings"
  | "admins"
  | "audit";

const operationalSections = [
  {
    value: "overview",
    label: "Overview",
    description: "Programme health",
    icon: LayoutDashboard,
  },
  {
    value: "forms",
    label: "Outstanding forms",
    description: "Follow-up queue",
    icon: ClipboardList,
  },
  {
    value: "pulse",
    label: "Pulse responses",
    description: "Relationship health",
    icon: HeartPulse,
  },
  {
    value: "exit",
    label: "Exit feedback",
    description: "Programme learning",
    icon: MessageSquareQuote,
  },
  {
    value: "incidents",
    label: "Incident review",
    description: "Safety and support",
    icon: Siren,
  },
  {
    value: "settings",
    label: "Programme settings",
    description: "Operating rules",
    icon: SlidersHorizontal,
  },
] as const;

const headAdminSections = [
  {
    value: "admins",
    label: "Administrators",
    description: "Access management",
    icon: UserCog,
  },
  {
    value: "audit",
    label: "Audit log",
    description: "Accountability trail",
    icon: ScrollText,
  },
] as const;

function AdminNavButton({
  active,
  label,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-white text-primary shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          active ? "bg-secondary text-[#80651f]" : "bg-white/10 text-white"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "block truncate text-xs",
            active ? "text-muted-foreground" : "text-white/45"
          )}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function AdminSidebar({
  access,
  activeSection,
  onSectionChange,
  mobile = false,
}: {
  access: AdminAccess;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  mobile?: boolean;
}) {
  const isHeadAdmin = access.role === "head_admin";

  return (
    <div className={cn("flex h-full flex-col bg-primary", mobile ? "" : "p-5")}>
      <div className={cn("border-white/10", mobile ? "px-1 pb-5" : "px-2 pb-5")}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#d7bb6a] text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-bold text-white">Programme Admin</p>
            <p className="text-xs text-white/50">ACS OBA Shepherds</p>
          </div>
        </div>
      </div>

      <nav
        className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1"
        aria-label="Admin sections"
      >
        {operationalSections.map((item) => (
          <AdminNavButton
            key={item.value}
            {...item}
            active={activeSection === item.value}
            onClick={() => onSectionChange(item.value)}
          />
        ))}

        {isHeadAdmin && (
          <>
            <p className="px-3 pb-1 pt-5 text-[0.68rem] font-bold tracking-[0.16em] text-[#d7bb6a] uppercase">
              Head admin
            </p>
            {headAdminSections.map((item) => (
              <AdminNavButton
                key={item.value}
                {...item}
                active={activeSection === item.value}
                onClick={() => onSectionChange(item.value)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="mt-5 border-t border-white/10 pt-5">
        <div className="mb-4 rounded-lg bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white">
            {access.name || "Administrator"}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/50">{access.email}</p>
          <AdminStatusBadge className="mt-2 border-[#d7bb6a]/30 bg-[#d7bb6a]/15 text-[#f4df9f]">
            {isHeadAdmin ? "Head administrator" : "Administrator"}
          </AdminStatusBadge>
        </div>
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Link href="/dashboard">
            <ArrowLeft />
            Back to app
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SectionContent({
  section,
  isHeadAdmin,
}: {
  section: AdminSection;
  isHeadAdmin: boolean;
}) {
  switch (section) {
    case "forms":
      return <OutstandingFormsSection />;
    case "pulse":
      return <PulseSurveysSection />;
    case "exit":
      return <ExitFeedbackSection />;
    case "incidents":
      return <IncidentReviewSection />;
    case "settings":
      return <ProgrammeSettingsSection />;
    case "admins":
      return isHeadAdmin ? <AdminManagementSection /> : null;
    case "audit":
      return isHeadAdmin ? <AuditLogSection /> : null;
    default:
      return <OverviewSection />;
  }
}

function DashboardWithAccess({ access }: { access: AdminAccess }) {
  const [activeSection, setActiveSection] =
    useState<AdminSection>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isHeadAdmin = access.role === "head_admin";
  const allSections = isHeadAdmin
    ? [...operationalSections, ...headAdminSections]
    : operationalSections;
  const activeItem =
    allSections.find((item) => item.value === activeSection) ??
    operationalSections[0];

  const changeSection = (section: AdminSection) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 md:block">
        <AdminSidebar
          access={access}
          activeSection={activeSection}
          onSectionChange={changeSection}
        />
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-primary/10 bg-[#f7f6f2]/95 px-4 backdrop-blur sm:px-6 md:px-8">
          <div className="md:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Open admin menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[19rem] border-0 bg-primary p-4 text-white"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Programme administration</SheetTitle>
                </SheetHeader>
                <AdminSidebar
                  access={access}
                  activeSection={activeSection}
                  onSectionChange={changeSection}
                  mobile
                />
              </SheetContent>
            </Sheet>
          </div>
          <div className="ml-3 min-w-0 md:ml-0">
            <p className="truncate text-sm font-semibold text-primary">
              {activeItem.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Programme administration
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <NotificationMenu />
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">
              Secure admin session
            </span>
          </div>
          <div className="ml-auto sm:hidden">
            <NotificationMenu />
          </div>
        </header>

        <main className="mx-auto max-w-[96rem] px-4 py-7 sm:px-6 md:px-8 md:py-10">
          <SectionContent section={activeSection} isHeadAdmin={isHeadAdmin} />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const access = useQuery(api.admin.getMyAccess);

  if (access === undefined) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] p-6">
        <Skeleton className="h-14 w-full" />
        <div className="mx-auto mt-8 max-w-6xl space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!access) {
    return null;
  }

  return <DashboardWithAccess access={access} />;
}

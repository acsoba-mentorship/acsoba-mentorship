"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** When true, show edit/add affordances. */
  showEdit?: boolean;
  /** Slot for the Add button (e.g. +). Renders in header when provided. */
  addTrigger?: React.ReactNode;
  /** Slot for the edit button (pencil). Use ProfileEditDialog with trigger=icon button. */
  editTrigger?: React.ReactNode;
  children: React.ReactNode;
}

export function ProfileSectionCard({
  title,
  description,
  icon,
  showEdit,
  addTrigger,
  editTrigger,
  children,
}: ProfileSectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="font-semibold">{title}</CardTitle>
          </div>
          {showEdit && (addTrigger ?? editTrigger)}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

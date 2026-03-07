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
  showEdit?: boolean; /** When true, show the edit button. Pass ProfileEditDialog as editTrigger. */
  editTrigger?: React.ReactNode; /** Slot for the edit button/dialog trigger. Use ProfileEditDialog with trigger=icon button. */
  children: React.ReactNode;
}

export function ProfileSectionCard({
  title,
  description,
  icon,
  showEdit,
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
          {showEdit && editTrigger}
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

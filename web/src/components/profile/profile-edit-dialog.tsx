"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileEditDialogProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Generic dialog shell for profile section editing.
 * Used across About, Goals, Interests, Education, Experience, and Mentor settings.
 */
export function ProfileEditDialog({
  trigger,
  title,
  description,
  children,
}: ProfileEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

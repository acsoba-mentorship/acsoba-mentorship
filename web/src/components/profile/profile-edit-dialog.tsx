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
  /** When omitted and open/onOpenChange are used, dialog is controlled only (no trigger). */
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  /** Controlled mode: when provided, caller can close on success. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  open,
  onOpenChange,
  children,
}: ProfileEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger != null && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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

import type { ReactNode } from "react";
import { HandHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Shared visual shell for a volunteering activity, styled to match the
 * internship browse card (icon header, top-right status badge, truncated
 * description, footer actions), so admin and member views look consistent.
 */
export function VolunteerActivityCard({
  name,
  description,
  isActive,
  topRightExtra,
  meta,
  footer,
}: {
  name: string;
  description?: string | null;
  isActive: boolean;
  topRightExtra?: ReactNode;
  meta?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-start gap-3 overflow-hidden">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandHeart className="size-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 text-base">{name}</CardTitle>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge
              className={
                isActive
                  ? "border-0 bg-emerald-50 text-emerald-700"
                  : "border-0 bg-muted text-muted-foreground"
              }
            >
              {isActive ? "Active" : "Retired"}
            </Badge>
            {topRightExtra}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {meta && <div className="mt-auto">{meta}</div>}

        <div className={meta ? "" : "mt-auto"}>{footer}</div>
      </CardContent>
    </Card>
  );
}

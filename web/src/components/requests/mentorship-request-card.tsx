import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Inbox, MessageSquare, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RequestStatus } from "./types";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "border-0 bg-amber-50 text-amber-700" },
    accepted: { label: "Accepted", className: "border-0 bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", className: "border-0 bg-red-50 text-red-700" },
  };
  const style = styles[status];

  return <Badge className={style.className}>{style.label}</Badge>;
}

export function MentorshipRequestCard({
  name,
  initials,
  title,
  message,
  tags,
  tagsLabel,
  status,
  createdAt,
  showActions = false,
  isUpdating = false,
  onAccept,
  onReject,
}: {
  name: string;
  initials: string;
  title: string;
  message: string;
  tags: string[];
  tagsLabel: string;
  status: RequestStatus;
  createdAt: number;
  showActions?: boolean;
  isUpdating?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{title}</CardDescription>
            </div>
          </div>
          <RequestStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="size-4 text-primary/60" />
            Message
          </div>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>

        {tags.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-4" />
              {tagsLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            Requested {formatDate(createdAt)}
          </div>
          {showActions && onAccept && onReject && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onReject}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Reject"}
              </Button>
              <Button size="sm" onClick={onAccept} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Accept"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestsEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary/10 p-4">
          <Icon className="size-8 text-primary/40" />
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function RequestsLoadingState({
  showActions = false,
}: {
  showActions?: boolean;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center justify-between border-t pt-4">
              <Skeleton className="h-4 w-32" />
              {showActions && (
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20 rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

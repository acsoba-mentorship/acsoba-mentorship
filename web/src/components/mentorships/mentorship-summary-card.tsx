import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type MentorshipSummaryCardProps = {
  role: string;
  participant?: {
    name?: string | null;
  } | null;
  startDate: number;
  plannedEndDate?: number | null;
  agreedDurationMonths?: number | null;
};

export function MentorshipSummaryCard({
  role,
  participant,
  startDate,
  plannedEndDate,
  agreedDurationMonths,
}: MentorshipSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentorship Workspace</CardTitle>
        <CardDescription>
          Manage goals, checklist items, and completion history for this active
          mentorship.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Your role</p>
          <p className="font-medium capitalize">{role}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Paired with</p>
          <p className="font-medium">{participant?.name ?? "Unknown user"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Started</p>
          <p className="font-medium">{formatDate(startDate)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Planned period</p>
          <p className="font-medium">
            {plannedEndDate
              ? `${formatDate(plannedEndDate)}${
                  agreedDurationMonths
                    ? ` (${agreedDurationMonths} months)`
                    : ""
                }`
              : "Not specified"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

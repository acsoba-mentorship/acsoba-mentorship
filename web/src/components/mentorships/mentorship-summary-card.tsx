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
};

export function MentorshipSummaryCard({
  role,
  participant,
  startDate,
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

      <CardContent className="grid gap-4 sm:grid-cols-3">
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
      </CardContent>
    </Card>
  );
}
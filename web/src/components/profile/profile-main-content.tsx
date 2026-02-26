import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles } from "lucide-react";
import type { MockUser } from "@/lib/types";

interface ProfileMainContentProps {
  user: MockUser;
}

export function ProfileMainContent({ user }: ProfileMainContentProps) {
  const mentee = user.menteeProfile;

  return (
    <div className="space-y-4">
      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {user.bio}
          </p>
        </CardContent>
      </Card>

      {/* Goals */}
      {mentee?.goals && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="size-3.5 text-muted-foreground" />
              <CardTitle className="font-semibold">Goals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mentee.goals}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interests */}
      {mentee && mentee.interests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-muted-foreground" />
              <CardTitle className="font-semibold">Interests</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Areas looking to develop.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {mentee.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

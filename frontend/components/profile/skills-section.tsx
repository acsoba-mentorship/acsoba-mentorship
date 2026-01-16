import { ProfileSection } from "./profile-section";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface SkillsSectionProps {
  title?: string;
  skills?: string[];
  interests?: string[];
  goals?: string[];
  skillLevel?: "beginner" | "intermediate" | "advanced";
  onEdit?: () => void;
}

export function SkillsSection({
  title = "Skills & Interests",
  skills,
  interests,
  goals,
  skillLevel,
  onEdit,
}: SkillsSectionProps) {
  const skillLevelLabels = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  return (
    <ProfileSection title={title} onEdit={onEdit}>
      <div className="space-y-6">
        {skillLevel && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Skill Level
            </h3>
            <Badge
              variant="outline"
              className={
                skillLevel === "advanced"
                  ? "border-green-500 text-green-600"
                  : skillLevel === "intermediate"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-blue-500 text-blue-600"
              }
            >
              {skillLevelLabels[skillLevel]}
            </Badge>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              {title.includes("Expertise") ? "Areas of Expertise" : "Skills"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {interests && interests.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Areas of Interest
            </h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <Badge key={index} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {goals && goals.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Learning Goals
            </h3>
            <ul className="space-y-2">
              {goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!skills?.length && !interests?.length && !goals?.length && !skillLevel && (
          <p className="text-gray-500 dark:text-gray-400">
            No skills or interests added yet.
          </p>
        )}
      </div>
    </ProfileSection>
  );
}

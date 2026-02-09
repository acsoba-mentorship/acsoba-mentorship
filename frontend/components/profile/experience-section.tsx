import { ProfileSection } from "./profile-section";
import { Experience } from "@/lib/types";
import { Briefcase } from "lucide-react";

interface ExperienceSectionProps {
  experience: Experience[];
  onEdit?: () => void;
}

export function ExperienceSection({
  experience,
  onEdit,
}: ExperienceSectionProps) {
  return (
    <ProfileSection title="Experience" onEdit={onEdit}>
      {experience.length > 0 ? (
        <div className="space-y-4">
          {experience.map((exp) => (
            <div key={exp.id} className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Briefcase className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{exp.title}</h3>
                  {exp.current && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {exp.startYear} - {exp.current ? "Present" : exp.endYear}
                </p>
                {exp.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No experience added yet.</p>
      )}
    </ProfileSection>
  );
}

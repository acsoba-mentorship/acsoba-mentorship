import { ProfileSection } from "./profile-section";
import { Education } from "@/lib/types";
import { GraduationCap } from "lucide-react";

interface EducationSectionProps {
  education: Education[];
  certifications?: string[];
  currentLearning?: string[];
  onEdit?: () => void;
}

export function EducationSection({
  education,
  certifications,
  currentLearning,
  onEdit,
}: EducationSectionProps) {
  return (
    <ProfileSection title="Education" onEdit={onEdit}>
      {education.length > 0 ? (
        <div className="space-y-4">
          {education.map((edu) => (
            <div key={edu.id} className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <GraduationCap className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {edu.degree} in {edu.field}
                  </h3>
                  {edu.current && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{edu.year}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No education added yet.</p>
      )}

      {certifications && certifications.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
            Certifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, index) => (
              <span
                key={index}
                className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {currentLearning && currentLearning.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
            Currently Learning
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentLearning.map((item, index) => (
              <span
                key={index}
                className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

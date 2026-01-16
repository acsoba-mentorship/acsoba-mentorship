import { ProfileSection } from "./profile-section";
import { Users } from "lucide-react";

interface SettingsSectionProps {
  maxMentees: number;
  currentMenteeCount: number;
  onEdit?: () => void;
}

export function SettingsSection({
  maxMentees,
  currentMenteeCount,
  onEdit,
}: SettingsSectionProps) {
  const spotsAvailable = maxMentees - currentMenteeCount;
  const isFull = spotsAvailable <= 0;

  return (
    <ProfileSection title="Mentorship Settings" onEdit={onEdit}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Users className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mentee Capacity</p>
            <p className="text-lg font-semibold">
              {currentMenteeCount} / {maxMentees} mentees
            </p>
          </div>
        </div>

        <div
          className={`rounded-md p-4 ${
            isFull
              ? "bg-red-50 dark:bg-red-900/20"
              : "bg-green-50 dark:bg-green-900/20"
          }`}
        >
          <p
            className={`font-medium ${
              isFull
                ? "text-red-700 dark:text-red-400"
                : "text-green-700 dark:text-green-400"
            }`}
          >
            {isFull
              ? "Not accepting new mentees"
              : `${spotsAvailable} spot${spotsAvailable > 1 ? "s" : ""} available`}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isFull
              ? "Your mentee limit has been reached. Update your settings to accept more mentees."
              : "You can accept new mentorship requests."}
          </p>
        </div>
      </div>
    </ProfileSection>
  );
}

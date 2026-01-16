import { ProfileSection } from "./profile-section";
import { Phone, Linkedin, Calendar, Clock } from "lucide-react";

interface PersonalSectionProps {
  phone?: string;
  linkedInUrl?: string;
  availability?: string;
  preferredMeetingFrequency?: string;
  onEdit?: () => void;
}

export function PersonalSection({
  phone,
  linkedInUrl,
  availability,
  preferredMeetingFrequency,
  onEdit,
}: PersonalSectionProps) {
  return (
    <ProfileSection title="Personal Details" onEdit={onEdit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium">{phone}</p>
            </div>
          </div>
        )}

        {linkedInUrl && (
          <div className="flex items-center gap-3">
            <Linkedin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">LinkedIn</p>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                View Profile
              </a>
            </div>
          </div>
        )}

        {availability && (
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
              <p className="font-medium">{availability}</p>
            </div>
          </div>
        )}

        {preferredMeetingFrequency && (
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preferred Meeting Frequency
              </p>
              <p className="font-medium">{preferredMeetingFrequency}</p>
            </div>
          </div>
        )}

        {!phone && !linkedInUrl && !availability && !preferredMeetingFrequency && (
          <p className="text-gray-500 dark:text-gray-400 col-span-2">
            No personal details added yet.
          </p>
        )}
      </div>
    </ProfileSection>
  );
}

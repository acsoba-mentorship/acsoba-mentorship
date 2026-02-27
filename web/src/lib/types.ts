export type ViewMode = "grid" | "list";

export type UserRole = "mentee" | "mentor";

export interface MockMentorProfile {
  yearsOfExperience: number;
  industries: string[];
  expertise: string[];
  maxMentees: number;
  isAvailable: boolean;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  profilePictureUrl: string;
  title: string;
  mentorProfile?: MockMentorProfile;
  menteeProfile?: {
    goals: string;
    interests: string[];
  };
}

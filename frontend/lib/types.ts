export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isVerifiedMentor: boolean;
  createdAt: string;
  location?: string;
  title?: string;
  phone?: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: number;
  current?: boolean;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startYear: number;
  endYear?: number;
  current: boolean;
  description?: string;
}

export interface MentorProfile {
  userId: string;
  bio: string;
  expertise: string[];
  yearsOfExperience: number;
  maxMentees: number;
  currentMenteeCount: number;
  availability: string;
  linkedInUrl?: string;
  education: Education[];
  experience: Experience[];
  certifications?: string[];
}

export interface MenteeProfile {
  userId: string;
  bio: string;
  goals: string[];
  interests: string[];
  preferredMeetingFrequency: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  education: Education[];
  experience: Experience[];
  currentLearning?: string[];
}

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentorId: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Mentorship {
  id: string;
  mentorId: string;
  menteeId: string;
  status: "active" | "completed" | "paused";
  goals: string[];
  objectives: string[];
  startDate: string;
  nextMeetingDate?: string;
  meetingFrequency: string;
}

export interface MentorWithUser extends MentorProfile {
  user: User;
}

export interface MenteeWithUser extends MenteeProfile {
  user: User;
}

export interface MentorshipRequestWithUsers extends MentorshipRequest {
  mentor: User;
  mentee: User;
}

export interface MentorshipWithUsers extends Mentorship {
  mentor: User;
  mentee: User;
}

// Filter options for search
export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export type ViewMode = "grid" | "list";

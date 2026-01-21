import {
  User,
  MentorProfile,
  MenteeProfile,
  MentorshipRequest,
  Mentorship,
  MentorWithUser,
  MenteeWithUser,
  MentorshipRequestWithUsers,
  MentorshipWithUsers,
  FilterOption,
} from "./types";

// Users
export const users: User[] = [
  {
    id: "user-1",
    email: "alex.johnson@example.com",
    firstName: "Alex",
    lastName: "Johnson",
    avatarUrl: undefined,
    isVerifiedMentor: true,
    createdAt: "2024-01-15T10:00:00Z",
    location: "San Francisco, CA",
    title: "Senior Software Engineer",
    phone: "+1 (555) 123-4567",
  },
  {
    id: "user-2",
    email: "sarah.chen@example.com",
    firstName: "Sarah",
    lastName: "Chen",
    avatarUrl: undefined,
    isVerifiedMentor: true,
    createdAt: "2024-02-20T14:30:00Z",
    location: "New York, NY",
    title: "Engineering Manager",
    phone: "+1 (555) 234-5678",
  },
  {
    id: "user-3",
    email: "michael.brown@example.com",
    firstName: "Michael",
    lastName: "Brown",
    avatarUrl: undefined,
    isVerifiedMentor: false,
    createdAt: "2024-03-10T09:15:00Z",
    location: "Austin, TX",
    title: "Junior Developer",
  },
  {
    id: "user-4",
    email: "emma.wilson@example.com",
    firstName: "Emma",
    lastName: "Wilson",
    avatarUrl: undefined,
    isVerifiedMentor: true,
    createdAt: "2024-01-05T16:45:00Z",
    location: "Seattle, WA",
    title: "Data Scientist",
    phone: "+1 (555) 345-6789",
  },
  {
    id: "user-5",
    email: "david.lee@example.com",
    firstName: "David",
    lastName: "Lee",
    avatarUrl: undefined,
    isVerifiedMentor: false,
    createdAt: "2024-04-01T11:00:00Z",
    location: "Los Angeles, CA",
    title: "Bootcamp Graduate",
  },
];

// Current user (simulating logged-in user who is both mentor and mentee)
export const currentUser: User = users[0];

// Mentor Profiles
export const mentorProfiles: MentorProfile[] = [
  {
    userId: "user-1",
    bio: "Senior software engineer with 10+ years of experience in full-stack development. Passionate about helping others grow in their tech careers. I specialize in building scalable web applications and mentoring engineers through career transitions.",
    expertise: ["React", "Node.js", "System Design", "Career Development", "TypeScript", "AWS"],
    yearsOfExperience: 12,
    maxMentees: 5,
    currentMenteeCount: 2,
    availability: "Weekday evenings",
    linkedInUrl: "https://linkedin.com/in/alexjohnson",
    education: [
      {
        id: "edu-1",
        degree: "M.S.",
        field: "Computer Science",
        institution: "Stanford University",
        year: 2012,
      },
      {
        id: "edu-2",
        degree: "B.S.",
        field: "Computer Engineering",
        institution: "UC Berkeley",
        year: 2010,
      },
    ],
    experience: [
      {
        id: "exp-1",
        title: "Senior Software Engineer",
        company: "Tech Corp",
        startYear: 2020,
        current: true,
        description: "Leading frontend architecture for enterprise products",
      },
      {
        id: "exp-2",
        title: "Software Engineer",
        company: "StartupXYZ",
        startYear: 2016,
        endYear: 2020,
        current: false,
        description: "Full-stack development for B2B SaaS platform",
      },
      {
        id: "exp-3",
        title: "Junior Developer",
        company: "WebAgency",
        startYear: 2012,
        endYear: 2016,
        current: false,
        description: "Built client websites and web applications",
      },
    ],
    certifications: ["AWS Solutions Architect", "Google Cloud Professional"],
  },
  {
    userId: "user-2",
    bio: "Product manager turned engineering leader. I love helping engineers transition into leadership roles and navigate the complexities of tech organizations. My approach focuses on both technical excellence and soft skills development.",
    expertise: ["Engineering Management", "Product Strategy", "Team Building", "Agile", "Technical Leadership"],
    yearsOfExperience: 8,
    maxMentees: 3,
    currentMenteeCount: 3,
    availability: "Weekends",
    education: [
      {
        id: "edu-3",
        degree: "MBA",
        field: "Technology Management",
        institution: "MIT Sloan",
        year: 2016,
      },
      {
        id: "edu-4",
        degree: "B.S.",
        field: "Information Systems",
        institution: "Carnegie Mellon",
        year: 2014,
      },
    ],
    experience: [
      {
        id: "exp-4",
        title: "Engineering Manager",
        company: "BigTech Inc",
        startYear: 2021,
        current: true,
        description: "Managing a team of 12 engineers across multiple products",
      },
      {
        id: "exp-5",
        title: "Senior Product Manager",
        company: "ProductCo",
        startYear: 2018,
        endYear: 2021,
        current: false,
        description: "Led product strategy for core platform features",
      },
    ],
    certifications: ["Certified Scrum Master", "PMP"],
  },
  {
    userId: "user-4",
    bio: "Data scientist specializing in ML/AI with a passion for making complex topics accessible. I help aspiring data professionals build strong foundations and transition into the field. Happy to guide you through your data science journey.",
    expertise: ["Machine Learning", "Python", "Data Analysis", "Statistics", "Deep Learning", "TensorFlow"],
    yearsOfExperience: 6,
    maxMentees: 4,
    currentMenteeCount: 1,
    availability: "Flexible",
    linkedInUrl: "https://linkedin.com/in/emmawilson",
    education: [
      {
        id: "edu-5",
        degree: "Ph.D.",
        field: "Machine Learning",
        institution: "University of Washington",
        year: 2018,
      },
      {
        id: "edu-6",
        degree: "B.S.",
        field: "Mathematics",
        institution: "UCLA",
        year: 2014,
      },
    ],
    experience: [
      {
        id: "exp-6",
        title: "Senior Data Scientist",
        company: "AI Startup",
        startYear: 2021,
        current: true,
        description: "Building ML models for recommendation systems",
      },
      {
        id: "exp-7",
        title: "Data Scientist",
        company: "Analytics Corp",
        startYear: 2018,
        endYear: 2021,
        current: false,
        description: "Developed predictive models for customer behavior",
      },
    ],
    certifications: ["TensorFlow Developer Certificate", "AWS Machine Learning Specialty"],
  },
];

// Mentee Profiles
export const menteeProfiles: MenteeProfile[] = [
  {
    userId: "user-3",
    bio: "Junior developer looking to level up my skills and transition into senior roles. I'm passionate about backend development and want to learn best practices for building scalable systems.",
    goals: ["Improve system design skills", "Learn best practices", "Career growth to senior level"],
    interests: ["Backend Development", "Cloud Architecture", "DevOps", "Microservices"],
    preferredMeetingFrequency: "Bi-weekly",
    skillLevel: "intermediate",
    education: [
      {
        id: "edu-7",
        degree: "B.S.",
        field: "Computer Science",
        institution: "University of Texas",
        year: 2022,
      },
    ],
    experience: [
      {
        id: "exp-8",
        title: "Junior Developer",
        company: "Local Tech Co",
        startYear: 2022,
        current: true,
        description: "Building and maintaining web applications",
      },
    ],
    currentLearning: ["Kubernetes", "System Design", "AWS"],
  },
  {
    userId: "user-5",
    bio: "Recent bootcamp graduate eager to break into the tech industry. I'm looking for guidance on building a strong portfolio and landing my first tech job.",
    goals: ["Land first tech job", "Build portfolio", "Network with professionals"],
    interests: ["Frontend Development", "React", "UI/UX", "JavaScript"],
    preferredMeetingFrequency: "Weekly",
    skillLevel: "beginner",
    education: [
      {
        id: "edu-8",
        degree: "Certificate",
        field: "Full-Stack Web Development",
        institution: "Coding Bootcamp",
        year: 2024,
        current: false,
      },
      {
        id: "edu-9",
        degree: "B.A.",
        field: "Business Administration",
        institution: "UCLA",
        year: 2020,
      },
    ],
    experience: [
      {
        id: "exp-9",
        title: "Marketing Coordinator",
        company: "Retail Corp",
        startYear: 2020,
        endYear: 2023,
        current: false,
        description: "Managed digital marketing campaigns",
      },
    ],
    currentLearning: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    userId: "user-1",
    bio: "Always learning! Looking for guidance in AI/ML to expand my skill set beyond traditional software engineering.",
    goals: ["Learn machine learning fundamentals", "Apply AI in web projects"],
    interests: ["AI/ML", "Python", "Data Science", "Neural Networks"],
    preferredMeetingFrequency: "Monthly",
    skillLevel: "advanced",
    education: [
      {
        id: "edu-1",
        degree: "M.S.",
        field: "Computer Science",
        institution: "Stanford University",
        year: 2012,
      },
      {
        id: "edu-2",
        degree: "B.S.",
        field: "Computer Engineering",
        institution: "UC Berkeley",
        year: 2010,
      },
    ],
    experience: [
      {
        id: "exp-1",
        title: "Senior Software Engineer",
        company: "Tech Corp",
        startYear: 2020,
        current: true,
        description: "Leading frontend architecture for enterprise products",
      },
    ],
    currentLearning: ["PyTorch", "Computer Vision", "NLP"],
  },
];

// Mentorship Requests
export const mentorshipRequests: MentorshipRequest[] = [
  {
    id: "request-1",
    menteeId: "user-3",
    mentorId: "user-1",
    message: "Hi Alex, I'm really impressed by your experience in full-stack development. I'd love to learn from you about system design and best practices.",
    status: "pending",
    createdAt: "2024-06-01T10:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
  },
  {
    id: "request-2",
    menteeId: "user-5",
    mentorId: "user-1",
    message: "Hello! I just graduated from a bootcamp and would love guidance on how to grow as a React developer.",
    status: "pending",
    createdAt: "2024-06-05T14:30:00Z",
    updatedAt: "2024-06-05T14:30:00Z",
  },
  {
    id: "request-3",
    menteeId: "user-1",
    mentorId: "user-4",
    message: "Hi Emma, I'm interested in learning more about machine learning. Would you be open to mentoring me?",
    status: "accepted",
    createdAt: "2024-05-20T09:00:00Z",
    updatedAt: "2024-05-22T11:00:00Z",
  },
];

// Active Mentorships
export const mentorships: Mentorship[] = [
  {
    id: "mentorship-1",
    mentorId: "user-1",
    menteeId: "user-3",
    status: "active",
    goals: ["Master system design", "Prepare for senior interviews"],
    objectives: [
      "Complete 5 system design exercises",
      "Review and improve current projects",
      "Practice mock interviews",
    ],
    startDate: "2024-04-01T00:00:00Z",
    nextMeetingDate: "2024-06-15T18:00:00Z",
    meetingFrequency: "Bi-weekly",
  },
  {
    id: "mentorship-2",
    mentorId: "user-4",
    menteeId: "user-1",
    status: "active",
    goals: ["Learn ML fundamentals", "Build a ML project"],
    objectives: [
      "Complete ML course",
      "Build sentiment analysis project",
      "Understand neural networks basics",
    ],
    startDate: "2024-05-25T00:00:00Z",
    nextMeetingDate: "2024-06-20T10:00:00Z",
    meetingFrequency: "Monthly",
  },
];

// Filter options for search
export const expertiseOptions: FilterOption[] = [
  { id: "exp-react", label: "React", value: "React" },
  { id: "exp-nodejs", label: "Node.js", value: "Node.js" },
  { id: "exp-python", label: "Python", value: "Python" },
  { id: "exp-ml", label: "Machine Learning", value: "Machine Learning" },
  { id: "exp-system-design", label: "System Design", value: "System Design" },
  { id: "exp-typescript", label: "TypeScript", value: "TypeScript" },
  { id: "exp-aws", label: "AWS", value: "AWS" },
  { id: "exp-management", label: "Engineering Management", value: "Engineering Management" },
  { id: "exp-career", label: "Career Development", value: "Career Development" },
  { id: "exp-data", label: "Data Analysis", value: "Data Analysis" },
];

export const experienceLevelOptions: FilterOption[] = [
  { id: "level-junior", label: "1-3 years", value: "junior" },
  { id: "level-mid", label: "4-7 years", value: "mid" },
  { id: "level-senior", label: "8-12 years", value: "senior" },
  { id: "level-expert", label: "12+ years", value: "expert" },
];

export const availabilityOptions: FilterOption[] = [
  { id: "avail-weekday", label: "Weekday evenings", value: "Weekday evenings" },
  { id: "avail-weekend", label: "Weekends", value: "Weekends" },
  { id: "avail-flexible", label: "Flexible", value: "Flexible" },
];

// Helper functions to get enriched data
export function getMentorsWithUsers(): MentorWithUser[] {
  return mentorProfiles.map((profile) => ({
    ...profile,
    user: users.find((u) => u.id === profile.userId)!,
  }));
}

export function getMentorWithUser(userId: string): MentorWithUser | undefined {
  const profile = mentorProfiles.find((p) => p.userId === userId);
  if (!profile) return undefined;
  return {
    ...profile,
    user: users.find((u) => u.id === profile.userId)!,
  };
}

export function getMenteeWithUser(userId: string): MenteeWithUser | undefined {
  const profile = menteeProfiles.find((p) => p.userId === userId);
  if (!profile) return undefined;
  return {
    ...profile,
    user: users.find((u) => u.id === profile.userId)!,
  };
}

export function getMentorshipRequestsForMentor(
  mentorId: string
): MentorshipRequestWithUsers[] {
  return mentorshipRequests
    .filter((req) => req.mentorId === mentorId)
    .map((req) => ({
      ...req,
      mentor: users.find((u) => u.id === req.mentorId)!,
      mentee: users.find((u) => u.id === req.menteeId)!,
    }));
}

export function getMentorshipRequestsForMentee(
  menteeId: string
): MentorshipRequestWithUsers[] {
  return mentorshipRequests
    .filter((req) => req.menteeId === menteeId)
    .map((req) => ({
      ...req,
      mentor: users.find((u) => u.id === req.mentorId)!,
      mentee: users.find((u) => u.id === req.menteeId)!,
    }));
}

export function getMentorshipsForMentor(
  mentorId: string
): MentorshipWithUsers[] {
  return mentorships
    .filter((m) => m.mentorId === mentorId)
    .map((m) => ({
      ...m,
      mentor: users.find((u) => u.id === m.mentorId)!,
      mentee: users.find((u) => u.id === m.menteeId)!,
    }));
}

export function getMentorshipsForMentee(
  menteeId: string
): MentorshipWithUsers[] {
  return mentorships
    .filter((m) => m.menteeId === menteeId)
    .map((m) => ({
      ...m,
      mentor: users.find((u) => u.id === m.mentorId)!,
      mentee: users.find((u) => u.id === m.menteeId)!,
    }));
}

// Get pending request from a specific mentee to a specific mentor
export function getPendingRequestFromMentee(
  menteeId: string,
  mentorId: string
): MentorshipRequestWithUsers | undefined {
  const request = mentorshipRequests.find(
    (req) => req.menteeId === menteeId && req.mentorId === mentorId && req.status === "pending"
  );
  if (!request) return undefined;
  return {
    ...request,
    mentor: users.find((u) => u.id === request.mentorId)!,
    mentee: users.find((u) => u.id === request.menteeId)!,
  };
}

// Filter mentors based on selected filters
export function filterMentors(
  mentors: MentorWithUser[],
  filters: {
    expertise: string[];
    experienceLevel: string[];
    availability: string[];
  }
): MentorWithUser[] {
  return mentors.filter((mentor) => {
    // Filter by expertise
    if (filters.expertise.length > 0) {
      const hasMatchingExpertise = filters.expertise.some((exp) =>
        mentor.expertise.includes(exp)
      );
      if (!hasMatchingExpertise) return false;
    }

    // Filter by experience level
    if (filters.experienceLevel.length > 0) {
      const years = mentor.yearsOfExperience;
      const matchesLevel = filters.experienceLevel.some((level) => {
        switch (level) {
          case "junior":
            return years >= 1 && years <= 3;
          case "mid":
            return years >= 4 && years <= 7;
          case "senior":
            return years >= 8 && years <= 12;
          case "expert":
            return years > 12;
          default:
            return true;
        }
      });
      if (!matchesLevel) return false;
    }

    // Filter by availability
    if (filters.availability.length > 0) {
      const matchesAvailability = filters.availability.some(
        (avail) => mentor.availability.toLowerCase().includes(avail.toLowerCase())
      );
      if (!matchesAvailability) return false;
    }

    return true;
  });
}

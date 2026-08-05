import { internalMutation, type MutationCtx } from "./_generated/server";
import {
  CAREER_STAGE,
  COMMITMENT_LEVEL,
  ONBOARDING_STATUS,
  PREFERRED_COMMUNICATION_MODE,
} from "./model/users/fields";

type CareerStage = (typeof CAREER_STAGE)[keyof typeof CAREER_STAGE];
type CommitmentLevel =
  (typeof COMMITMENT_LEVEL)[keyof typeof COMMITMENT_LEVEL];
type PreferredCommunicationMode =
  (typeof PREFERRED_COMMUNICATION_MODE)[keyof typeof PREFERRED_COMMUNICATION_MODE];

export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const usernameUpdatedAt =
      now - (30 * 24 * 60 * 60 * 1000) - 1; // so users can change immediately in dev

    const mentorsFirstNames = [
      "Emma",
      "Alex",
      "Sarah",
      "Marcus",
      "Priya",
      "Daniel",
      "Maya",
      "Jordan",
      "Sofia",
      "Noah",
      "Ava",
      "Ethan",
      "Chloe",
      "Liam",
      "Grace",
    ];

    const menteesFirstNames = [
      "Olivia",
      "Benjamin",
      "Amelia",
      "William",
      "Isabella",
      "James",
      "Sophia",
      "Lucas",
      "Charlotte",
      "Henry",
      "Evelyn",
      "Michael",
      "Harper",
      "Alexander",
      "Victoria",
    ];

    const lastNames = [
      "Nguyen",
      "Patel",
      "Kim",
      "Garcia",
      "Brown",
      "Lee",
      "Martinez",
      "Davis",
      "Clark",
      "Rodriguez",
      "Lopez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
    ];

    const mentorIndustries = [
      ["Technology", "AI/ML"],
      ["Technology", "Fintech"],
      ["Healthcare", "Technology"],
      ["Cloud Computing", "Technology"],
      ["Design", "Technology"],
    ] as const;

    const mentorExpertise = [
      ["Machine Learning", "NLP", "Computer Vision", "Python"],
      ["Full Stack", "React", "Node.js", "Leadership"],
      ["Data Science", "Statistics", "Python", "Healthcare Analytics"],
      ["AWS", "Distributed Systems", "Kubernetes", "DevOps"],
      ["UX Design", "User Research", "Figma", "Design Systems"],
    ] as const;

    const menteeGoals = [
      "Level up engineering fundamentals and ship a portfolio project.",
      "Build confidence with interviews and system design practice.",
      "Grow faster by getting structured feedback and learning plans.",
      "Improve my career direction and find a focus area for growth.",
      "Master new tools with guidance and accountability.",
    ];

    const menteeInterests = [
      ["Machine Learning", "Web Development", "Public Speaking"],
      ["Product Design", "Data Visualization", "Career Coaching"],
      ["React", "Node.js", "Distributed Systems"],
      ["Statistics", "Healthcare Analytics", "Python"],
      ["Cloud", "DevOps", "Kubernetes"],
    ] as const;

    const usersToInsert: Array<{
      name: string;
      username: string;
      tokenIdentifier: string;
      title: string;
      bio: string;
      location: string;
      email: string;
      gender: string;
      nationality: string;
      profilePictureUrl: string;
      phoneNumber: string;
      careerStage?: CareerStage;
      interests?: string[];
      industries?: string[];
      menteeProfile?: {
        goals: string;
        commitmentLevel: CommitmentLevel;
        preferredCommunicationModes: PreferredCommunicationMode[];
      };
      mentorProfile?: {
        yearsOfExperience: number;
        expertise: string[];
        maxMentees: number;
        isAvailable: boolean;
      };
    }> = [];

    for (let i = 0; i < 15; i++) {
      const first = mentorsFirstNames[i] ?? `Mentor${i + 1}`;
      const last = lastNames[i % lastNames.length] ?? `Last${i + 1}`;
      const idx = String(i + 1).padStart(2, "0");
      const username = `sample_mentor_${idx}`;
      const tokenIdentifier = `sample-mentor-token-${idx}`;

      const industryPair = mentorIndustries[i % mentorIndustries.length];
      const expertiseSet = mentorExpertise[i % mentorExpertise.length];

      usersToInsert.push({
        name: `${first} ${last}`,
        username,
        tokenIdentifier,
        title: `Sample Mentor — ${industryPair[1]}`,
        bio:
          "Sample mentor profile for development and UI testing. Share goals, get feedback, and build momentum.",
        location: "Remote",
        email: `mentor.${idx}@example.com`,
        gender: "",
        nationality: "",
        profilePictureUrl: "",
        phoneNumber: `+155501${idx}`,
        industries: [...industryPair],
        mentorProfile: {
          yearsOfExperience: 6 + i,
          expertise: [...expertiseSet],
          maxMentees: 2 + (i % 3),
          isAvailable: i % 2 === 0,
        },
      });
    }

    for (let i = 0; i < 15; i++) {
      const first = menteesFirstNames[i] ?? `Mentee${i + 1}`;
      const last = lastNames[(i + 7) % lastNames.length] ?? `Last${i + 1}`;
      const idx = String(i + 1).padStart(2, "0");
      const username = `sample_mentee_${idx}`;
      const tokenIdentifier = `sample-mentee-token-${idx}`;

      const interests = menteeInterests[i % menteeInterests.length];
      usersToInsert.push({
        name: `${first} ${last}`,
        username,
        tokenIdentifier,
        title: "Sample Mentee",
        bio: "Sample mentee profile for development and UI testing.",
        location: "Remote",
        email: `mentee.${idx}@example.com`,
        gender: "",
        nationality: "",
        profilePictureUrl: "",
        phoneNumber: "",
        careerStage: CAREER_STAGE.STUDENT,
        interests: [...interests],
        menteeProfile: {
          goals: menteeGoals[i % menteeGoals.length],
          commitmentLevel: COMMITMENT_LEVEL.MONTHLY,
          preferredCommunicationModes: [
            PREFERRED_COMMUNICATION_MODE.VIDEO_CALL,
            PREFERRED_COMMUNICATION_MODE.EMAIL,
          ],
        },
      });
    }

    // Insert missing seeded users and refresh their deterministic profile data
    // so existing local databases can be updated without deleting data.
    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    for (const u of usersToInsert) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", u.username))
        .unique();

      if (existing) {
        skipped += 1;
        await ctx.db.patch("users", existing._id, {
          phoneNumber: u.phoneNumber,
          ...(u.careerStage ? { careerStage: u.careerStage } : {}),
          ...(u.interests ? { interests: u.interests } : {}),
          ...(u.industries ? { industries: u.industries } : {}),
          ...(u.menteeProfile ? { menteeProfile: u.menteeProfile } : {}),
          onboardingStatus: ONBOARDING_STATUS.COMPLETE,
        });
        updated += 1;
        continue;
      }

      await ctx.db.insert("users", {
        name: u.name,
        username: u.username,
        usernameUpdatedAt,
        isTemporaryUsername: false,
        dateOfBirth: 0,
        gender: u.gender,
        nationality: u.nationality,
        tokenIdentifier: u.tokenIdentifier,
        profilePictureUrl: u.profilePictureUrl,
        title: u.title,
        bio: u.bio,
        location: u.location,
        email: u.email,
        phoneNumber: u.phoneNumber,
        ...(u.careerStage ? { careerStage: u.careerStage } : {}),
        interests: u.interests ?? [],
        industries: u.industries ?? [],
        education: [],
        experience: [],
        ...(u.menteeProfile ? { menteeProfile: u.menteeProfile } : {}),
        ...(u.mentorProfile ? { mentorProfile: u.mentorProfile } : {}),
        onboardingStatus: ONBOARDING_STATUS.COMPLETE,
        createdAt: now,
      });

      inserted += 1;
    }

    return { inserted, skipped, updated };
  },
});

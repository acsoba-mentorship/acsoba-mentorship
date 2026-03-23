import { internalMutation, type MutationCtx } from "./_generated/server";

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
      menteeProfile?: { goals: string; interests: string[] };
      mentorProfile?: {
        yearsOfExperience: number;
        industries: string[];
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
        phoneNumber: "",
        mentorProfile: {
          yearsOfExperience: 6 + i,
          industries: [...industryPair],
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
        menteeProfile: {
          goals: menteeGoals[i % menteeGoals.length],
          interests: [...interests],
        },
      });
    }

    // If the deterministic seed data already exists, skip seeding.
    // We check fixed/unique fields (`username`)
    const seedMentor01 = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "sample_mentor_01"))
      .unique();
    const seedMentee01 = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "sample_mentee_01"))
      .unique();

    const allSeedPresent = Boolean(seedMentor01 && seedMentee01);
    if (allSeedPresent) {
      return { inserted: 0, skipped: 30 };
    }

    // Otherwise, insert missing seeded users idempotently.
    let inserted = 0;
    let skipped = 0;

    for (const u of usersToInsert) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", u.username))
        .unique();

      if (existing) {
        skipped += 1;
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
        education: [],
        experience: [],
        ...(u.menteeProfile ? { menteeProfile: u.menteeProfile } : {}),
        ...(u.mentorProfile ? { mentorProfile: u.mentorProfile } : {}),
        onboardingStatus: "mentee_profile_setup_complete",
        createdAt: now,
      });

      inserted += 1;
    }

    return { inserted, skipped };
  },
});


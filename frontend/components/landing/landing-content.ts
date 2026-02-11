export type FeaturedMentor = {
  id: string;
  name: string;
  title: string;
  domain: string;
  bio: string;
  avatarInitials: string;
  tags: string[];
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
};

export const featuredMentors: FeaturedMentor[] = [
  {
    id: "mentor-1",
    name: "Alex Rivera",
    title: "Senior Frontend Engineer · Acme Corp",
    domain: "Frontend & UX",
    bio: "Helps early-career engineers grow from tutorial-level knowledge to shipping polished features in production.",
    avatarInitials: "AR",
    tags: ["React", "TypeScript", "Early-career"],
  },
  {
    id: "mentor-2",
    name: "Priya Shah",
    title: "Staff Data Scientist · Northwind",
    domain: "Data & ML",
    bio: "Guides mentees through breaking into data science roles and leveling up real-world problem solving.",
    avatarInitials: "PS",
    tags: ["Data Science", "ML", "Career switch"],
  },
  {
    id: "mentor-3",
    name: "Michael Chen",
    title: "Engineering Manager · Contoso",
    domain: "Leadership & Career",
    bio: "Supports engineers who are navigating promotions, communication, and transitioning into leadership.",
    avatarInitials: "MC",
    tags: ["Leadership", "Communication", "Promotion"],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Sara, Junior Developer",
    role: "Landed first engineering role",
    quote:
      "Finding a mentor here gave me the accountability and feedback I was missing. I went from stuck to shipping real features in a few months.",
  },
  {
    id: "testimonial-2",
    name: "Jamal, Career Switcher",
    role: "From support to engineering",
    quote:
      "My mentor helped me map out a realistic path into software from a non-traditional background. The 1:1 guidance was a game changer.",
  },
  {
    id: "testimonial-3",
    name: "Elena, Mid-level Engineer",
    role: "Growing into leadership",
    quote:
      "Having a mentor outside my company gave me a safe space to talk through leadership challenges and grow faster.",
  },
];


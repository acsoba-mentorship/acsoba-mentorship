import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { SolutionsSection } from "@/components/landing/solutions-section";
import { FeaturedMentorsSection } from "@/components/landing/featured-mentors-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export const metadata: Metadata = {
  title: "ACS OBA Shepherds — Mentorship Platform",
  description:
    "Connect with experienced mentors and accelerate your career through structured mentorship.",
};

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <FeaturedMentorsSection />
      <TestimonialsSection />
    </>
  );
}

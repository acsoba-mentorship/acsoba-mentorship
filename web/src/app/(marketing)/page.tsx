import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { SolutionsSection } from "@/components/landing/solutions-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "ACS OBA Shepherds — Mentorship Platform",
  description:
    "Connect with experienced mentors and accelerate your career through structured mentorship.",
};

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <Separator />
      <SolutionsSection />
      {/* TODO: FeaturedMentorsSection removed — listMentors requires auth and returns
          sensitive fields. Re-add once a public/sanitized mentor endpoint exists. */}
      <Separator />
      <TestimonialsSection />
    </>
  );
}

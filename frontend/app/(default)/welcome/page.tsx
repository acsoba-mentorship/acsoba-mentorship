import { FeaturedMentorsSection } from "@/components/landing/featured-mentors-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SolutionsSection } from "@/components/landing/solutions-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export default function WelcomePage() {
  return (
    <>
      <HeroSection />
      <SolutionsSection />
      <FeaturedMentorsSection />
      <TestimonialsSection />
    </>
  );
}



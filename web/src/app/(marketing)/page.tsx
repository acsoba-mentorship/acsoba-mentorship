import { HeroSection } from "@/components/landing/hero-section";
import { SolutionsSection } from "@/components/landing/solutions-section";
import { FeaturedMentorsSection } from "@/components/landing/featured-mentors-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

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

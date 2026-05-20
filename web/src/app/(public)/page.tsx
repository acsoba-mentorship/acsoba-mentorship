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

export default function PublicHomePage() {
  return (
    <>
      <HeroSection />
      <Separator />
      <SolutionsSection />
      <Separator />
      <TestimonialsSection />
    </>
  );
}

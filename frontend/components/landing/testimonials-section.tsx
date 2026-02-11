import { testimonials } from "./landing-content";
import { TestimonialCard } from "./testimonial-card";

export function TestimonialsSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What mentees are saying
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Real stories from people who used focused mentorship to unlock their next step.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50/0 to-gray-50/40 dark:from-gray-950/0 dark:to-gray-950/40" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50/0 to-gray-50/40 dark:from-gray-950/0 dark:to-gray-950/40" />

          <div
            className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:none]"
            style={{ scrollbarWidth: "none" }}
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


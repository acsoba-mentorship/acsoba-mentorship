import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "My mentor helped me transition from a junior role to a senior engineer in just 18 months. The guidance was invaluable.",
    name: "Adebayo Ogunlade",
    title: "Senior Software Engineer",
    initials: "AO",
  },
  {
    quote:
      "Having someone experienced to bounce ideas off of changed everything. I finally feel confident in my career direction.",
    name: "Chidinma Eze",
    title: "Product Manager",
    initials: "CE",
  },
  {
    quote:
      "The structured mentorship approach helped me set clear goals and actually achieve them. Highly recommend this platform.",
    name: "Femi Adeyemi",
    title: "Data Analyst",
    initials: "FA",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            What our mentees say
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hear from people who have accelerated their careers through
            mentorship.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardContent className="pt-6">
                <div className="flex gap-0.5 text-secondary-foreground">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i} className="text-base">{star}</span>
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

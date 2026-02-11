import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "./landing-content";

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="min-w-[260px] max-w-xs flex-shrink-0 border-muted/60 bg-background/80 shadow-sm backdrop-blur-sm">
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </CardContent>
    </Card>
  );
}


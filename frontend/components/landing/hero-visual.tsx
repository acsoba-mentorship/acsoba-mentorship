import { Users } from "lucide-react";

type HeroVisualProps = {
  className?: string;
};

// Placeholder visual for the hero section.
// This is intentionally simple so it can later be replaced with a Rive animation.
export function HeroVisual({ className }: HeroVisualProps) {
  return (
    <div
      className={
        "relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-6 text-white shadow-lg " +
        (className ?? "")
      }
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-white/80">
              Mentor matching
            </p>
            <p className="text-lg font-semibold">Built for real careers</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/80">
          <p>Future-ready space for a live hero animation.</p>
          <p className="text-xs">
            This container can be swapped with a Rive animation component without changing the
            surrounding layout.
          </p>
        </div>
      </div>
    </div>
  );
}


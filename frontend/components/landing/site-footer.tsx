import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto max-w-6xl px-4 py-10 text-sm">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                <span className="text-xs font-semibold">MP</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Mentorship Platform
              </span>
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              Connect with mentors or share your experience to help others grow through focused,
              one-on-one guidance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                For mentees
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/search"
                    className="text-xs text-foreground/80 hover:text-primary"
                  >
                    Find a mentor
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                For mentors
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/mentor"
                    className="text-xs text-foreground/80 hover:text-primary"
                  >
                    Join as mentor
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Legal
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/terms"
                    className="text-xs text-foreground/80 hover:text-primary"
                  >
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-xs text-foreground/80 hover:text-primary"
                  >
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Mentorship Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


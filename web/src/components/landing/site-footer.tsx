import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-bold text-lg">ACS OBA Shepherds</p>
            <p className="mt-2 text-sm text-primary-foreground/60">
              Connecting alumni for mentorship, career advice, and shared wisdom.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Links</p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                Home
              </Link>
              <Link href="/search" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                Mentors
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">Contact</p>
            <nav className="mt-3 flex flex-col gap-2">
              <span className="text-sm text-primary-foreground/70">contact@acsobashepherds.com</span>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-primary-foreground/10 pt-6">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} ACS OBA Shepherds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

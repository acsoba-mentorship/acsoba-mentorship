import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ACS OBA Shepherds. All rights
            reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Find Mentors
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

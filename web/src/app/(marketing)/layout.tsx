import { SiteNav } from "@/components/navigation/site-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      {children}
    </div>
  );
}

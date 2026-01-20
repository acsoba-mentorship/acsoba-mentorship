import { MentorNav } from "@/components/navigation/mentor-nav";
import { MentorBreadcrumb } from "@/components/navigation/mentor-breadcrumb";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <MentorNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6">
          <MentorBreadcrumb />
        </div>
        {children}
      </main>
    </div>
  );
}

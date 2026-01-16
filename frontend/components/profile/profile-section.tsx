import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

export function ProfileSection({ title, children, onEdit }: ProfileSectionProps) {
  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

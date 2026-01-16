"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  exactMatch?: boolean;
}

export function NavLink({ href, children, className, exactMatch = false }: NavLinkProps) {
  const pathname = usePathname();
  
  const isActive = exactMatch 
    ? pathname === href 
    : pathname === href || (href !== "/mentee" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
        className
      )}
    >
      {children}
    </Link>
  );
}

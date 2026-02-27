import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Mentors — ACS OBA Shepherds",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

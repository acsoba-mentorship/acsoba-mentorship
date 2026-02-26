import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Requests — ACS OBA Shepherds",
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

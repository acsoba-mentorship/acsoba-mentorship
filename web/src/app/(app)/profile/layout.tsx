import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — ACS OBA Shepherds",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

"use client";

import { useRouter } from "next/navigation";

import { BrowseInternships } from "@/components/internships/browse-internships";
import { MyInternshipInterests } from "@/components/internships/my-internship-interests";
import { MyInternshipPostings } from "@/components/internships/my-internship-postings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export type InternshipTab = "browse" | "my-postings" | "my-interests";

export function InternshipsTabs({
  activeTab,
}: {
  activeTab: InternshipTab;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(nextTab) =>
        router.replace(`/internships?tab=${nextTab}`, { scroll: false })
      }
    >
      <TabsList>
        <TabsTrigger value="browse">Browse</TabsTrigger>
        <TabsTrigger value="my-postings">My Postings</TabsTrigger>
        <TabsTrigger value="my-interests">My Interests</TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="mt-6">
        <BrowseInternships />
      </TabsContent>
      <TabsContent value="my-postings" className="mt-6">
        <MyInternshipPostings />
      </TabsContent>
      <TabsContent value="my-interests" className="mt-6">
        <MyInternshipInterests />
      </TabsContent>
    </Tabs>
  );
}

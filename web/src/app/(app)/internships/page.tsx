"use client";

import { Briefcase } from "lucide-react";

import { OfferInternshipDialog } from "@/components/internships/offer-internship-dialog";
import { BrowseInternships } from "@/components/internships/browse-internships";
import { MyInternshipPostings } from "@/components/internships/my-internship-postings";
import { MyInternshipInterests } from "@/components/internships/my-internship-interests";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function InternshipsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="size-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">Internships</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Members and alumni can offer internships, and members who are
              still in school or between jobs can indicate interest.
            </p>
          </div>
        </div>
        <OfferInternshipDialog />
      </div>

      <Tabs defaultValue="browse">
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
    </div>
  );
}

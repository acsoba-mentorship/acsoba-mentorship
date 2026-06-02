"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnauthenticatedCTA() {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (  
    <div className="flex flex-wrap gap-4">
      <Button
        size="lg"
        variant="destructive"
        onClick={() => {
          if (!isLoading)
            void loginWithRedirect({
              authorizationParams: { screen_hint: "signup" },
            });
        }}
      >
        Join as Mentor
        <ArrowRight />
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="border-white/40 hover:bg-white/10 hover:text-white"
        onClick={() => {
          if (!isLoading) void loginWithRedirect();
        }}
      >
        Find a Mentor
      </Button>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary via-[#001A4D] to-[#002F6C] py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          The Best Is Yet To Be. Give Back. Guide Forward.
        </h1>
        <p className="mt-6 text-lg leading-8 text-white/70">
          Connect with fellow ACS alumni for mentorship, career advice, and
          shared wisdom. Your experience can shape the next generation.
        </p>
        <div className="mt-10">
          <UnauthenticatedCTA />
        </div>
        </div>
      </div>
    </section>
  );
}

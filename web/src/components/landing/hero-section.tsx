"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnauthenticatedCTA() {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (  
    <div className="flex flex-wrap justify-center gap-4">
      <Button
        size="lg"
        onClick={() => {
          if (!isLoading)
            void loginWithRedirect({
              authorizationParams: { screen_hint: "signup" },
            });
        }}
      >
        Get Started
        <ArrowRight />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          if (!isLoading) void loginWithRedirect();
        }}
      >
        Log In
      </Button>
    </div>
  );
}

function AuthenticatedCTA() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Button size="lg" asChild>
        <Link href="/dashboard">
          Go to Dashboard
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Find the mentor who&apos;ll shape your future
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          ACS OBA Shepherds connects aspiring professionals with experienced
          mentors. Get personalized guidance, grow your skills, and accelerate
          your career.
        </p>
        <div className="mt-10">
          <Authenticated>
            <AuthenticatedCTA />
          </Authenticated>
          <Unauthenticated>
            <UnauthenticatedCTA />
          </Unauthenticated>
        </div>
      </div>
    </section>
  );
}

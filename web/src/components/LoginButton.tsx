"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";

export default function LoginButton() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    if (isLoading) return;
    void loginWithRedirect();
  };

  const handleSignup = () => {
    if (isLoading) return;
    void loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Button size="lg" onClick={handleSignup}>
        Sign Up
      </Button>
      <Button variant="outline" size="lg" onClick={handleLogin}>
        Log In
      </Button>
    </div>
  );
}

"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const { logout, isLoading } = useAuth0();

  const handleLogout = () => {
    if (isLoading) return;
    void logout({
      logoutParams: {
        returnTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  return (
    <Button variant="destructive" size="lg" onClick={handleLogout}>
      Log Out
    </Button>
  );
}

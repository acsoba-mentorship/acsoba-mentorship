'use client'
import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";

export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only run if we are authenticated and haven't synced yet this session
    if (isAuthenticated && !done) {
      storeUser().then(() => setDone(true));
    }
  }, [isAuthenticated, storeUser, done]);

  return null; // This component renders nothing
}
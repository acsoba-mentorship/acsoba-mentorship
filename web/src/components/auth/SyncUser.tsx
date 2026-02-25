'use client';

import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

const SYNCED_KEY = "convex_user_synced";

export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      sessionStorage.removeItem(SYNCED_KEY);
      return;
    }

    if (!isLoading && isAuthenticated && !sessionStorage.getItem(SYNCED_KEY)) { 
      storeUser().then(() => sessionStorage.setItem(SYNCED_KEY, "1"));
    }
  }, [isLoading, isAuthenticated, storeUser]);

  return null;
}
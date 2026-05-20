"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type CurrentUser = Doc<"users"> | null;

type CurrentUserContextValue = {
  currentUser: CurrentUser | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwnProfile: (viewedUserId: string | null | undefined) => boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // When not authenticated, skip the query entirely
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const value = useMemo<CurrentUserContextValue>(() => {
    const currentId = currentUser?._id ? String(currentUser._id) : null;

    const isOwnProfile = (viewedUserId: string | null | undefined) => {
      if (!currentId || !viewedUserId) return false;
      return String(viewedUserId) === currentId;
    };

    return {
      currentUser,
      isAuthenticated,
      isLoading,
      isOwnProfile,
    };
  }, [isAuthenticated, isLoading, currentUser]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error(
      "useCurrentUser must be used within a CurrentUserProvider component"
    );
  }
  return ctx;
}


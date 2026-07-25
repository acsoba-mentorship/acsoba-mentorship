'use client';

import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const retryAttempt = useRef(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      retryAttempt.current = 0;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    void storeUser()
      .then(() => {
        if (!cancelled) {
          retryAttempt.current = 0;
          setSyncFailed(false);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSyncFailed(true);
        const retryDelayMs = Math.min(
          1_000 * 2 ** retryAttempt.current,
          30_000
        );
        retryAttempt.current += 1;
        retryTimer = setTimeout(() => {
          setRetryNonce((nonce) => nonce + 1);
        }, retryDelayMs);
      });

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [isLoading, isAuthenticated, retryNonce, storeUser]);

  if (!isAuthenticated || !syncFailed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-destructive/30 bg-background p-4 shadow-lg"
    >
      <AlertCircle className="size-5 shrink-0 text-destructive" />
      <p className="flex-1 text-sm">
        We could not finish setting up your account. We will retry
        automatically.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setRetryNonce((nonce) => nonce + 1)}
      >
        Retry now
      </Button>
    </div>
  );
}

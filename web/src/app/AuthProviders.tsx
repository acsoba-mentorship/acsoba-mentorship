"use client";

import { ReactNode } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function AuthProviders({ children }: { children: ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  if (!domain || !clientId) {
    // Fail loudly in development if Auth0 is not configured.
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Missing NEXT_PUBLIC_AUTH0_DOMAIN or NEXT_PUBLIC_AUTH0_CLIENT_ID environment variables."
      );
    }
  }

  return (
    <Auth0Provider
      domain={domain ?? ""}
      clientId={clientId ?? ""}
      authorizationParams={{
        redirect_uri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <ConvexProviderWithAuth0 client={convex}>
        {children}
      </ConvexProviderWithAuth0>
    </Auth0Provider>
  );
}


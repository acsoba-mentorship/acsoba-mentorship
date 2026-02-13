import type { AuthConfig } from "convex/server";

const authConfig: AuthConfig = {
  providers: [
    {
      domain: process.env.AUTH0_DOMAIN as string,
      applicationID: process.env.AUTH0_CLIENT_ID as string,
    },
  ],
};

export default authConfig;


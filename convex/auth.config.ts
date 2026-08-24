import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://legal-louse-53.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

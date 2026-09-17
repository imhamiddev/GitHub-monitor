import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Fetches the current session on the server, deduped per-request via
 * React's cache(). Never trust a userId coming from the client —
 * always read it from here.
 */
export const getServerSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

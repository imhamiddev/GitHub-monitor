import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/demo",
        "/dashboard",
        "/repositories",
        "/activity",
        "/statistics",
        "/alerts",
        "/team",
        "/settings",
        "/onboarding",
        "/api",
      ],
    },
  };
}

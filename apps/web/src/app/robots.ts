import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/app areas should not be indexed.
      disallow: ["/dashboard/", "/auth/", "/account"]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}

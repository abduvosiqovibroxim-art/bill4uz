import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Public, indexable routes.
const routes = [
  "/",
  "/tournaments",
  "/players",
  "/coaches",
  "/rankings",
  "/booking",
  "/news",
  "/media",
  "/about",
  "/contacts",
  "/advertise"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7
  }));
}

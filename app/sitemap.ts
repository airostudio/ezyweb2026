import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/create", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/gallery", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" as const },
  ].map((r) => ({ url: `${siteConfig.url}${r.path}`, lastModified: now, changeFrequency: r.changeFrequency, priority: r.priority }));
}

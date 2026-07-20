import type { MetadataRoute } from "next";
import { contributionSnapshot } from "@/lib/portfolio-data";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(
        `${contributionSnapshot.capturedAt}T00:00:00.000Z`,
      ),
    },
  ];
}

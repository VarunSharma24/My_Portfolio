import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://varun.sh", lastModified: new Date() },
    { url: "https://varun.sh/privacy", lastModified: new Date() },
  ];
}

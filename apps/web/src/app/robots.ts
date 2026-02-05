import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/"], // Prevent crawling of private dashboard pages
    },
    sitemap: "https://nexo-manager.vercel.app/sitemap.xml",
  };
}

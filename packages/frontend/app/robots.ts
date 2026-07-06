import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://konarobinson.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/manager", "/signin"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

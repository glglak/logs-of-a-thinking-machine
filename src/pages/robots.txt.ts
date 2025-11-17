import type { APIRoute } from "astro";
import { SITE } from "@/config";

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

# Disallow admin and private paths
Disallow: /api/
Disallow: /_astro/

# Sitemap
Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  // Use SITE.website as fallback if site is not available
  const baseURL = site || new URL(SITE.website);
  const sitemapURL = new URL("sitemap-index.xml", baseURL);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

import { SITE_URL } from "@/lib/site";

/**
 * Crawling is allowed on purpose. The pitch host is kept out of the index with a
 * noindex HEADER instead, in next.config.mjs. They are different switches:
 * robots.txt governs fetching, and a crawler told not to fetch can never see a
 * noindex, so a URL discovered from a link elsewhere still gets listed, with no
 * title and no snippet.
 *
 * Their live robots.txt at pastramijoes.com/robots.txt still disallows
 * /calendar/action* and /events/action* for a calendar plugin that is not
 * installed and has no pages in their sitemap, and sets Crawl-delay: 3, which
 * throttles crawlers for no reason on a nine page site.
 *
 * NOTE: this file is the only robots source in the repo. A static
 * public/robots.txt would take precedence and silently win, so there is not one.
 */
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

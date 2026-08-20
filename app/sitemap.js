import { SITE_URL, site } from "@/lib/site";

const routes = ["", "/menu", "/specials", "/order", "/catering", "/locations", "/about", "/jobs", "/charity", "/contact"];

export default function sitemap() {
  const pages = routes.map((r) => ({
    url: `${SITE_URL}${r}`,
    changeFrequency: r === "/specials" ? "weekly" : "monthly",
    priority: r === "" ? 1 : 0.7,
  }));

  // Generated from the locations array, so a third store appears in the sitemap
  // the same day it appears in lib/site.js.
  const locations = site.locations.map((l) => ({
    url: `${SITE_URL}/locations/${l.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pages, ...locations];
}

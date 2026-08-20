import { Anton, Figtree } from "next/font/google";
import Header from "@/components/Header";
import HoursBar from "@/components/HoursBar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { site, SITE_URL } from "@/lib/site";
import { openingHoursSpec } from "@/lib/hours";
import "./globals.css";

/**
 * Self-hosted at build time. next/font/google downloads the files during the
 * build and serves them from this site's own origin, so there is no runtime
 * request to Google and nothing breaks if Google does. A runtime <link> to a
 * font CDN would be a third-party dependency the client did not choose.
 *
 * Anton is the condensed poster face a deli board is set in, and it is doing
 * the job their hand-lettered roundel already implies. It is one weight and it
 * is very heavy, so it is used for short headings only and never for a
 * paragraph. Figtree carries everything a person actually reads.
 *
 * Deliberately not Inter, which is on three house sites already.
 */
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
});

/**
 * THE WHOLE SITE RENDERS PER REQUEST.
 *
 * Not a performance oversight. Every page carries the open/closed strip, which
 * reads the Michigan clock, and the footer prints the current year. A page whose
 * content depends on the current time cannot be statically generated or
 * revalidated on a timer: regeneration is request-triggered, so on a quiet site
 * the cached page ages indefinitely and the badge would tell people the deli is
 * open at three in the morning. The same trap froze a copyright year and printed
 * "taking orders for 2027" on another site in this account.
 *
 * The cost is one render per request on a site with no database. The saving is
 * that the one fact this rebuild exists to get right cannot go stale.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  // Their real domain, not a preview host. Pointing metadataBase at a
  // .vercel.app makes every canonical and OG url advertise a duplicate of the
  // site as the original.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pastrami Joe's | New York style deli in Marshall and Battle Creek",
    template: "%s | Pastrami Joe's",
  },
  description:
    "Hot pastrami and Sy Ginsberg corned beef, cut to order. Two counters in Calhoun County, Michigan: Marshall from 7am and Battle Creek weekday lunch. Hours, menu and online ordering.",
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: SITE_URL,
    // Next does NOT deep-merge openGraph: a page defining its own block replaces
    // the parent's wholesale, image included. Every page in this repo overrides
    // only `title` and `description`, which do merge, so the card set here is
    // the card on every route. Adding an `openGraph` block to any page means
    // repeating this image there too.
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Hot pastrami, cut to order. Pastrami Joe's, Marshall and Battle Creek, Michigan.",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/assets/pjs/favicon-180.png", apple: "/assets/pjs/favicon-180.png" },
};

export const viewport = { themeColor: "#00703C" };

/**
 * A Restaurant node per location, which their live site has none of anywhere.
 *
 * The openingHours come out of the same array the badge and the hours tables
 * read, so the structured data cannot drift from the page. That matters more
 * than usual here: their listings currently publish six contradictory sets of
 * hours precisely because there has never been one machine-readable source for
 * a crawler to prefer.
 */
function schema() {
  return {
    "@context": "https://schema.org",
    "@graph": site.locations.map((l) => ({
      "@type": "Restaurant",
      "@id": `${SITE_URL}/locations/${l.slug}#restaurant`,
      name: l.brand === site.name ? site.name : `${site.name} (${l.brand})`,
      url: `${SITE_URL}/locations/${l.slug}`,
      telephone: l.phone.display,
      servesCuisine: ["Deli", "Sandwiches", "American"],
      priceRange: "$$",
      foundingDate: String(l.opened),
      image: `${SITE_URL}${l.photo}`,
      logo: `${SITE_URL}/assets/pjs/logo-512.png`,
      address: {
        "@type": "PostalAddress",
        streetAddress: l.street,
        addressLocality: l.city,
        addressRegion: l.region,
        postalCode: l.postal,
        addressCountry: "US",
      },
      openingHoursSpecification: openingHoursSpec(l),
      hasMenu: `${SITE_URL}/menu?at=${l.slug}`,
      acceptsReservations: false,
      sameAs: [site.social.facebook, site.social.instagram],
    })),
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema()) }}
        />
        <a className="skip" href="#main">
          Skip to content
        </a>
        <HoursBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Reveal />
      </body>
    </html>
  );
}

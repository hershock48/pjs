"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/site";

/**
 * One header on every route.
 *
 * Their live site runs two: the Battle Creek section has its own nav with its
 * own labels, so a visitor who lands on /battlecreek/ can reach five pages and a
 * visitor who lands on / can reach nine, and neither nav mentions the other
 * store's hours. The two-nav split is also what produced two contact forms and
 * two menus. One nav, and the locations live behind one link.
 */
export default function Header() {
  const path = usePathname();
  const current = (href) => (path === href || path.startsWith(href + "/") ? "page" : undefined);

  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link className="hdr-brand" href="/">
          {/* The mark is their own PastramiJoelogo.svg. Its viewBox is cropped
              to the painted bounds, measured by pixel-scanning a 2448px render:
              the file declares 612x792 and paints 236x236 of it, so 61% of the
              width was empty matting. No coordinate moved. */}
          <img src="/assets/pjs/logo.svg" width="46" height="46" alt="" />
          <b>
            Pastrami Joe&rsquo;s
            <span className="sr"> home</span>
          </b>
        </Link>

        <nav className="hdr-nav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              {n.label}
            </Link>
          ))}
          <Link className="btn" href="/order" style={{ marginLeft: 6 }}>
            Order online
          </Link>
        </nav>
      </div>
    </header>
  );
}

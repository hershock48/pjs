import Link from "next/link";
import Status from "@/components/Status";
import { site } from "@/lib/site";

/**
 * Both stores, open or shut, on every page of the site.
 *
 * This strip is the single biggest change between this build and the site it
 * replaces. Eleven live pages there publish no hours at all, which is why six
 * third-party listings publish six different answers and three of them say the
 * Marshall store opens at 11am when it opens at 7.
 *
 * It is a server component reading the Michigan clock at request time. See the
 * note on `dynamic` in app/layout.js for why the whole site renders per request
 * rather than being cached.
 */
export default function HoursBar() {
  return (
    <div className="hoursbar">
      <div className="hoursbar-in">
        {site.locations.map((l) => (
          <Link key={l.slug} href={`/locations/${l.slug}`} className="hoursbar-item">
            <b>{l.name}</b>
            <Status location={l} />
          </Link>
        ))}
        {/* This slot used to read "Sy Ginsberg corned beef, cut to order", which
            is nearly the same sentence as the line in the footer bar directly
            below it on every page. Two copies of one idea on one screen is a
            tic, so the strip carries the practical line and the footer keeps the
            supplier. */}
        <Link href="/order" className="hoursbar-note small">
          Order ahead from either counter
        </Link>
      </div>
    </div>
  );
}

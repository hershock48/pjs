"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Mark from "@/components/Mark";
import { nav, site } from "@/lib/site";

/**
 * One header on every route.
 *
 * Their live site runs two: the Battle Creek section has its own nav with its
 * own labels, so a visitor who lands on /battlecreek/ can reach five pages and a
 * visitor who lands on / can reach nine, and neither nav mentions the other
 * store's hours. The two-nav split is also what produced two contact forms and
 * two menus. One nav, and the locations live behind one link.
 *
 * THE MOBILE NAV IS A DISCLOSURE, NOT A SCROLL STRIP. It used to be a
 * horizontally scrolling row, which technically fitted and genuinely did not
 * overflow the page, so the audit passed it. On a 390px screen it still put
 * "Order online" off the right edge with no affordance saying to swipe: the one
 * action the whole site exists to drive was invisible until you guessed. A
 * screenshot is what caught it, not a measurement.
 *
 * So on mobile: brand, a phone button, an always-visible Order button, and a
 * toggle for the rest. Nothing that matters is hidden behind a swipe.
 */
export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef(null);
  const current = (href) => (path === href || path.startsWith(href + "/") ? "page" : undefined);

  // Close on navigation. Without the pathname dependency the panel stays open
  // over the page you just moved to, which is the same class of bug as the
  // reveal observer not re-arming.
  useEffect(() => setOpen(false), [path]);

  // Escape closes, and focus goes back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        panel.current?.previousElementSibling?.focus?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const first = site.locations[0];

  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link className="hdr-brand" href="/">
          {/* Their own mark, in two layers so the man can lean and the badge
              cannot. See components/Mark.jsx. The source viewBox is cropped to
              the painted bounds, measured by pixel-scanning a 2448px render:
              the file declares 612x792 and paints 236x236 of it, so 61% of the
              width was empty matting. No coordinate moved. */}
          <Mark size={46} />
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
          <Link className="btn" href="/order">
            Order online
          </Link>
        </nav>

        {/* Mobile only. The phone number is a real action for a deli at
            11.40am and it is one tap here rather than three pages deep. */}
        <div className="hdr-mob">
          <a className="hdr-icon" href={`tel:${first.phone.tel}`} aria-label={`Call ${first.name}, ${first.phone.display}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z"
              />
            </svg>
          </a>
          <Link className="btn hdr-order" href="/order">
            Order
          </Link>
          <button
            className="hdr-icon"
            type="button"
            aria-expanded={open}
            aria-controls="hdr-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr">{open ? "Close menu" : "Menu"}</span>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              {open ? (
                <path fill="currentColor" d="m5.3 4 14.7 14.7-1.3 1.3L4 5.3 5.3 4Zm14.7 1.3L5.3 20 4 18.7 18.7 4 20 5.3Z" />
              ) : (
                <path fill="currentColor" d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
              )}
            </svg>
          </button>
          <div className="hdr-panel" id="hdr-panel" ref={panel} hidden={!open}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={current(n.href)}>
                {n.label}
              </Link>
            ))}
            <Link href="/contact">Contact</Link>
            <Link href="/jobs">Jobs</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

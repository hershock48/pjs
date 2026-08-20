import { status } from "@/lib/hours";

/**
 * The open / closed badge.
 *
 * Colour is never the only thing carrying the state. Every badge says the words
 * as well: "Open until 7pm", "Opens tomorrow at 7am". A red dot alone is
 * unreadable to anybody who cannot separate it from the green one, and it is
 * also unreadable to somebody glancing at a phone in sunlight.
 *
 * This is computed at request time. Every route that renders it declares
 * `export const dynamic = "force-dynamic"`, because a statically generated page
 * freezes its clock at build time and would tell people the shop is open at
 * three in the morning for as long as the page stayed cached.
 */
export default function Status({ location, className = "" }) {
  const s = status(location);
  const tone = s.open ? (s.closingSoon ? "is-soon" : "is-open") : "is-shut";
  return (
    <span className={`status ${tone} ${className}`}>
      <span className="dot" aria-hidden="true" />
      {s.message}
    </span>
  );
}

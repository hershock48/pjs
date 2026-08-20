import Link from "next/link";
import Status from "@/components/Status";
import { schedule } from "@/lib/hours";

/**
 * A location, everywhere a location appears: the homepage, /locations, the
 * footer of the catering page.
 *
 * Address, phone as a real tel: link, hours as a table, the open badge, and the
 * ordering link for that store. All five come out of lib/site.js, so a change of
 * hours is one edit and cannot land on one surface and miss another. The
 * duplicated-fact failure this replaces is on their site right now: their
 * homepage, both menus and both contact pages each carry the addresses as typed
 * text, so there are ten copies of two addresses and no way to grep them.
 */
export default function LocationCard({ location, compact = false }) {
  const rows = schedule(location);
  return (
    <div className="card" style={{ padding: compact ? 20 : 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ marginRight: "auto" }}>{location.name}</h3>
        <Status location={location} />
      </div>

      {location.brand !== "Pastrami Joe's" && (
        <p className="small" style={{ marginBottom: 10 }}>
          The counter here trades as <b>{location.brand}</b>. Same kitchen, same board, smaller room.
        </p>
      )}

      <address style={{ fontStyle: "normal", marginBottom: 14 }}>
        {location.street}
        <br />
        {location.city}, {location.region} {location.postal}
        <br />
        <a href={`tel:${location.phone.tel}`}>{location.phone.display}</a>
      </address>

      <dl className="hours" style={{ marginBottom: 16 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "contents" }}>
            <dt>{r.label}</dt>
            <dd className={r.closed ? "closed" : undefined}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {!compact && <p className="small" style={{ marginBottom: 16 }}>{location.blurb}</p>}

      <div className="btnrow">
        <a className="btn" href={location.orderUrl} rel="noopener">
          Order from {location.name}
        </a>
        <Link className="btn ghost" href={`/locations/${location.slug}`}>
          Details
        </Link>
      </div>
    </div>
  );
}

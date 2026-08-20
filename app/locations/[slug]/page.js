import Link from "next/link";
import { notFound } from "next/navigation";
import Status from "@/components/Status";
import MenuList from "@/components/MenuList";
import { site, bySlug } from "@/lib/site";
import { schedule } from "@/lib/hours";
import { groupsFor } from "@/lib/menu";

/**
 * NO generateStaticParams HERE, ON PURPOSE.
 *
 * The first build of this route had one, and the build output marked it ● SSG,
 * "prerendered as static HTML", even though the root layout declares
 * force-dynamic. generateStaticParams wins for the routes it names, so both
 * location pages would have been baked at build time with their open/closed
 * badge frozen at whatever o'clock the deploy happened to run.
 *
 * That is the exact failure in the house log: a page whose content depends on
 * the current time cannot be statically generated, because regeneration is
 * request-triggered and on a quiet site the cached page ages indefinitely.
 *
 * Caught by reading the build output rather than by assuming the layout
 * setting propagated. tools/flow-checks.mjs now asserts it, so it cannot come
 * back quietly.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const l = bySlug(slug);
  if (!l) return {};
  const hours = schedule(l)
    .filter((r) => !r.closed)
    .map((r) => `${r.label} ${r.value}`)
    .join(", ");
  return {
    title: `${l.name}, ${l.street}`,
    description: `Pastrami Joe's in ${l.city}, Michigan. ${l.street}. ${hours}. ${l.blurb}`,
    alternates: { canonical: `/locations/${l.slug}` },
  };
}

export default async function Location({ params }) {
  const { slug } = await params;
  const l = bySlug(slug);
  if (!l) notFound();

  const rows = schedule(l);
  const groups = groupsFor(l.slug);
  const other = site.locations.find((x) => x.slug !== l.slug);
  const mapQuery = encodeURIComponent(`${l.street}, ${l.city}, ${l.region} ${l.postal}`);

  return (
    <>
      <section className="tight">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <span className="kicker">{l.isOriginal ? "The original counter" : "Downtown Battle Creek"}</span>
              <h1>{l.name}</h1>
              <div style={{ marginTop: 16 }}>
                <Status location={l} />
              </div>
              <p className="lede" style={{ marginTop: 16 }}>
                {l.blurb}
              </p>

              <address style={{ fontStyle: "normal", marginTop: 20, fontSize: 17 }}>
                {l.street}
                <br />
                {l.city}, {l.region} {l.postal}
                <br />
                <a href={`tel:${l.phone.tel}`}>{l.phone.display}</a>
              </address>

              <div className="btnrow" style={{ marginTop: 22 }}>
                <a className="btn" href={l.orderUrl} rel="noopener">
                  Order from {l.name}
                </a>
                <a
                  className="btn ghost"
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  rel="noopener"
                >
                  Directions
                </a>
              </div>
            </div>

            <img
              className="hero-photo"
              src={l.photo}
              width="1440"
              height="1080"
              alt={l.photoAlt}
            />
          </div>
        </div>
      </section>

      <div className="checkrule" role="presentation" />

      <section className="tight">
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 26 }}>Hours</h2>
              <dl className="hours" style={{ marginTop: 16, fontSize: 16 }}>
                {rows.map((r) => (
                  <div key={r.label} style={{ display: "contents" }}>
                    <dt>{r.label}</dt>
                    <dd className={r.closed ? "closed" : undefined}>{r.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="small" style={{ marginTop: 16 }}>
                Holiday hours go up here first, and on Facebook the same morning.
              </p>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 26 }}>What this counter does</h2>
              <ul style={{ marginTop: 14, paddingLeft: 20, display: "grid", gap: 8 }}>
                {l.serves.includes("breakfast") && <li>Breakfast from {rows[0].value.split(" to ")[0]}, sammys, burritos, biscuits and gravy.</li>}
                {l.serves.includes("pizza") && <li>Nine and fourteen inch pizza, with a gluten free crust on the small.</li>}
                <li>The full sandwich board, hot and cold, made to order.</li>
                {l.serves.includes("soup") && <li>Soup daily, plus chicken noodle and the chili every day.</li>}
                {l.serves.includes("catering") && (
                  <li>
                    <Link href="/catering">Catering</Link> out of this kitchen.
                  </li>
                )}
                <li>{l.seats} seats inside.</li>
              </ul>

              {l.brand !== site.name && (
                <p className="small" style={{ marginTop: 16 }}>
                  The sign here reads <b>{l.brand}</b>. It is the same deli, the same meat
                  and the same recipes, in a smaller room.
                </p>
              )}

              {other && (
                <p className="small" style={{ marginTop: 16 }}>
                  Looking for the other counter?{" "}
                  <Link href={`/locations/${other.slug}`}>{other.name}</Link>.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <h2>The {l.name} board</h2>
          <p className="small" style={{ marginTop: 8 }}>
            Everything below is made at this counter.
          </p>
        </div>
      </section>

      <MenuList groups={groups} slug={l.slug} />
    </>
  );
}

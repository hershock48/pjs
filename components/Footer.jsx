import Link from "next/link";
import GlazedPlate from "@/components/GlazedPlate";
import { site, nav } from "@/lib/site";
import { schedule } from "@/lib/hours";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          {site.locations.map((l) => (
            <div key={l.slug}>
              <h3>{l.name}</h3>
              <address style={{ fontStyle: "normal", fontSize: 15, marginBottom: 10 }}>
                {l.street}
                <br />
                {l.city}, {l.region} {l.postal}
                <br />
                <a href={`tel:${l.phone.tel}`}>{l.phone.display}</a>
              </address>
              <dl className="hours" style={{ fontSize: 14, maxWidth: 240 }}>
                {schedule(l).map((r) => (
                  <div key={r.label} style={{ display: "contents" }}>
                    <dt style={{ color: "#b7d6c1" }}>{r.label}</dt>
                    <dd style={{ color: "#eef5ef" }}>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <div>
            <h3>Pages</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 15, display: "grid", gap: 6 }}>
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/order">Order online</Link>
              </li>
              <li>
                <Link href="/jobs">Jobs</Link>
              </li>
              <li>
                <Link href="/charity">Charitable requests</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>Follow</h3>
            <ul style={{ listStyle: "none", padding: 0, fontSize: 15, display: "grid", gap: 6 }}>
              <li>
                <a href={site.social.facebook} rel="noopener">
                  Facebook
                </a>
              </li>
              {/* Their @pastramijoes account exists and is linked from nowhere
                  on the current site. */}
              <li>
                <a href={site.social.instagram} rel="noopener">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="ftr-bar">
          <span>&copy; {new Date().getFullYear()} Pastrami Joe&rsquo;s. All rights reserved.</span>
          <span>Sy Ginsberg corned beef and pastrami, from Detroit.</span>
        </div>
      </div>

      {/* Last child of <footer>, outside .wrap so the drip is full bleed. The
          client's copyright stays in their own bar above; only the credit moves
          onto the plate. */}
      <GlazedPlate line="Double Dipped by" />
    </footer>
  );
}

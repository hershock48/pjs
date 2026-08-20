import Link from "next/link";
import InquiryForm from "@/components/InquiryForm";
import Status from "@/components/Status";
import { schedule } from "@/lib/hours";
import { site } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description:
    "Phone numbers, addresses and hours for Pastrami Joe’s in Marshall and Little Joe’s in Battle Creek.",
  alternates: { canonical: "/contact" },
};

/**
 * One contact page.
 *
 * Their site runs /contact/ and /contact-battle-creek/, two near-identical
 * Formidable forms on two pages, neither of which publishes an hour.
 */
export default function Contact() {
  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">Get hold of us</span>
          <h1>Contact</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            The fastest answer is the phone, because somebody is standing next to it.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div style={{ display: "grid", gap: 20 }}>
              {site.locations.map((l) => (
                <div key={l.slug} className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <h2 style={{ fontSize: 26, marginRight: "auto" }}>{l.name}</h2>
                    <Status location={l} />
                  </div>
                  <address style={{ fontStyle: "normal", marginTop: 12 }}>
                    {l.street}
                    <br />
                    {l.city}, {l.region} {l.postal}
                    <br />
                    <a href={`tel:${l.phone.tel}`}>{l.phone.display}</a>
                  </address>
                  <dl className="hours" style={{ marginTop: 14, maxWidth: 300 }}>
                    {schedule(l).map((r) => (
                      <div key={r.label} style={{ display: "contents" }}>
                        <dt>{r.label}</dt>
                        <dd className={r.closed ? "closed" : undefined}>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="small" style={{ marginTop: 14 }}>
                    <Link href={`/locations/${l.slug}`}>Directions and what this counter makes</Link>
                  </p>
                </div>
              ))}
            </div>

            <div>
              <h2 style={{ fontSize: 26, marginBottom: 14 }}>Send a message</h2>
              <InquiryForm kind="general" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

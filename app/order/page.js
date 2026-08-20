import Link from "next/link";
import Status from "@/components/Status";
import { schedule } from "@/lib/hours";
import { site } from "@/lib/site";

export const metadata = {
  title: "Order online",
  description:
    "Order ahead from the Marshall or Battle Creek counter. Pick the one you are collecting from and we will have it wrapped.",
  alternates: { canonical: "/order" },
};

/**
 * One ordering hub, on their own domain.
 *
 * Their site has no page like this. "Order Online Marshall" in the nav goes
 * straight off to pastramijoesmarshall.hrpos.heartland.us, the Battle Creek nav
 * goes to a different Heartland subdomain, and pastramijoes.com/online-ordering/
 * is a 404. So there is no page on their site that answers "can I order right
 * now, and from where."
 *
 * The links still hand off to Heartland, because replacing their POS is not what
 * this rebuild is for. What changes is that the customer chooses from a page
 * that knows whether each counter is open, on the domain they searched for.
 */
export default function Order() {
  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">Pick a counter</span>
          <h1>Order online</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Ordering runs on our till system, so the last step happens on their page.
            Choose where you are collecting from.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g2">
            {site.locations.map((l) => {
              const rows = schedule(l);
              return (
                <div key={l.slug} className="card" style={{ padding: 26 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <h2 style={{ fontSize: 30, marginRight: "auto" }}>{l.name}</h2>
                    <Status location={l} />
                  </div>
                  <p className="small" style={{ marginTop: 12 }}>
                    {l.street}, {l.city}
                  </p>
                  <dl className="hours" style={{ marginTop: 14, maxWidth: 300 }}>
                    {rows.map((r) => (
                      <div key={r.label} style={{ display: "contents" }}>
                        <dt>{r.label}</dt>
                        <dd className={r.closed ? "closed" : undefined}>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="btnrow" style={{ marginTop: 20 }}>
                    <a className="btn big" href={l.orderUrl} rel="noopener">
                      Order from {l.name}
                    </a>
                  </div>
                  <p className="small" style={{ marginTop: 12 }}>
                    Or call <a href={`tel:${l.phone.tel}`}>{l.phone.display}</a> and we will
                    have it wrapped.
                  </p>
                </div>
              );
            })}
          </div>

          <div className="notice" style={{ marginTop: 26, maxWidth: 720 }}>
            <b>Catering is a different form.</b>
            Trays, boxed lunches and anything for a crowd goes through{" "}
            <Link href="/catering">the catering page</Link> so we can call you back and
            get it right.
          </div>
        </div>
      </section>
    </>
  );
}

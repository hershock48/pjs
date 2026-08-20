import InquiryForm from "@/components/InquiryForm";
import { catering } from "@/lib/menu";
import { site } from "@/lib/site";

export const metadata = {
  title: "Catering",
  description:
    "Sub and wrap trays at $7.00 a head, boxed lunches, salads, soup by the gallon and breakfast. Full catering prices for Marshall and Battle Creek.",
  alternates: { canonical: "/catering" },
};

const money = (n) => `$${n.toFixed(2)}`;

function priceLine(p) {
  const base = money(p.price);
  return p.to ? `${base} to ${money(p.to)}` : base;
}

export default function Catering() {
  return (
    <>
      <section className="tight">
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: "center", gap: 36 }}>
            <div>
              <span className="kicker">Catering</span>
              <h1>{catering.tagline}</h1>
              <p className="lede" style={{ marginTop: 16 }}>
                Parties are better when somebody else does the cooking. Family, office or
                event, out of either counter.
              </p>
              <div className="btnrow" style={{ marginTop: 22 }}>
                {site.locations.map((l) => (
                  <a key={l.slug} className="btn ghost" href={`tel:${l.phone.tel}`}>
                    {l.name} {l.phone.display}
                  </a>
                ))}
              </div>
            </div>
            <img
              src="/assets/pjs/catering.webp"
              width="567"
              height="849"
              alt="A long table of people eating deli food together."
              style={{ borderRadius: 18, border: "1px solid var(--green-line)", width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      <div className="checkrule" role="presentation" />

      <section>
        <div className="wrap">
          <h2>Prices</h2>
          <p className="small" style={{ marginTop: 10, maxWidth: "60ch" }}>
            {/* NOT .toLowerCase(): it flattened Italian and Caesar, which are
                proper nouns on their own printed menu. */}
            Tray varieties: {catering.varieties.join(", ")}.
          </p>

          <div className="grid g2" style={{ marginTop: 24, alignItems: "start" }}>
            {catering.groups.map((g) => (
              <div key={g.title} className="card reveal" style={{ padding: "6px 22px 18px" }}>
                <h3 style={{ marginTop: 18, letterSpacing: "0.09em" }}>{g.title}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                  {g.items.map((it) => (
                    <li key={it.name} className="mitem">
                      <span className="mname">{it.name}</span>
                      <span className="mprice">
                        {it.prices.map((p, i) => (
                          <span key={p.label} style={{ display: "block", fontSize: 15 }}>
                            <span style={{ color: "var(--muted)", fontWeight: 500 }}>{p.label} </span>
                            {priceLine(p)}
                          </span>
                        ))}
                      </span>
                      {it.desc && <span className="mdesc">{it.desc}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="small" style={{ marginTop: 20, maxWidth: "60ch" }}>
            {catering.custom}
          </p>
        </div>
      </section>

      <section className="check" style={{ borderTop: "1px solid var(--green-line)" }}>
        <div className="wrap narrow">
          <h2>Start planning</h2>
          <p className="lede" style={{ marginTop: 12, marginBottom: 22 }}>
            Give us the shape of the event and somebody calls you back to go through the
            menu.
          </p>
          <InquiryForm kind="catering" />
        </div>
      </section>
    </>
  );
}

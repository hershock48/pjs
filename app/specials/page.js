import { week } from "@/lib/menu";

export const metadata = {
  title: "This week",
  description:
    "The soup of the day for every day of the week, plus the seasonal sandwiches and pizzas on the board right now.",
  alternates: { canonical: "/specials" },
};

const money = (n) => `$${n.toFixed(2)}`;

const longDate = (iso) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", month: "long", day: "numeric", year: "numeric" }).format(
    new Date(`${iso}T12:00:00Z`)
  );

const todayName = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "long" }).format(new Date());

export default function Specials() {
  const day = todayName();

  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">Soups and seasonal</span>
          <h1>This week</h1>
          {/* The date stamp is the entire point of this page's header. Their
              live Weekly Features page is genuinely maintained and carries no
              date, so the one current page on the site reads as possibly years
              old to anybody looking at it. */}
          <p className="lede" style={{ marginTop: 14 }}>
            Last updated {longDate(week.updated)}.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div className="card reveal" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 26 }}>Soup</h2>
              <p className="small" style={{ marginTop: 10 }}>
                {week.daily}
              </p>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 18, display: "grid", gap: 0 }}>
                {week.soups.map((s) => {
                  const isToday = s.day === day;
                  return (
                    <li
                      key={s.day}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 16,
                        padding: "12px 0",
                        borderTop: "1px solid var(--green-line)",
                      }}
                    >
                      <span style={{ fontWeight: isToday ? 800 : 500 }}>
                        {s.day}
                        {isToday && (
                          <span className="tag sig" style={{ marginLeft: 8 }}>
                            Today
                          </span>
                        )}
                      </span>
                      <span style={{ fontWeight: isToday ? 800 : 400, textAlign: "right" }}>{s.soup}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="small" style={{ marginTop: 16 }}>
                Cup $4.49, bowl $5.49. Add a cup to any sandwich for $3.99.
              </p>
            </div>

            <div className="reveal" style={{ display: "grid", gap: 20 }}>
              <h2 style={{ fontSize: 26 }}>On the board now</h2>
              {week.seasonal.map((s) => (
                <article key={s.name} className="card" style={{ padding: 22 }}>
                  <h3>{s.name}</h3>
                  <p className="small" style={{ marginTop: 8 }}>
                    {s.desc}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14 }}>
                    {s.prices.map((p) => (
                      <span key={p.label} style={{ fontWeight: 700 }}>
                        {p.label} <span style={{ color: "var(--green-deep)" }}>{money(p.price)}</span>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              <p className="small">
                Seasonal items come and go. If one is on this page it is on the board.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

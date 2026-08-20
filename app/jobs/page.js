import { site } from "@/lib/site";

export const metadata = {
  title: "Jobs",
  description:
    "Counter and kitchen roles at Pastrami Joe's in Marshall and Battle Creek. Training available, apply in person or start here.",
  alternates: { canonical: "/jobs" },
};

const roles = [
  {
    title: "Counter and cashier",
    body: "Taking orders, wrapping sandwiches and talking to people all day. Days, no late nights.",
  },
  {
    title: "Line cook and sandwich maker",
    body: "On the grill and the case, building lunch, dinner and catering orders. Fast, and better with company.",
  },
];

export default function Jobs() {
  return (
    <>
      <section className="tight">
        <div className="wrap narrow">
          <span className="kicker">Hiring</span>
          <h1>Come work the counter</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Experience helps and is not required. Training is available for every role and
            pay goes with what you bring.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g2">
            {roles.map((r) => (
              <div key={r.title} className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 24 }}>{r.title}</h2>
                <p className="small" style={{ marginTop: 10 }}>
                  {r.body}
                </p>
              </div>
            ))}
          </div>

          {/* Their current jobs page hands out a PDF application uploaded in
              March 2020 and asks people to print it and drop it off. Replaced
              with a phone number and an in-person ask, which is what actually
              happens, until there is a mailbox behind a form. See the README. */}
          <div className="card" style={{ padding: 24, marginTop: 22 }}>
            <h2 style={{ fontSize: 24 }}>How to apply</h2>
            <p style={{ marginTop: 12 }}>
              Come in and ask for a manager during opening hours, or call the counter you
              would rather work at.
            </p>
            <div className="btnrow" style={{ marginTop: 18 }}>
              {site.locations.map((l) => (
                <a key={l.slug} className="btn ghost" href={`tel:${l.phone.tel}`}>
                  {l.name} {l.phone.display}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

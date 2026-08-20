import Link from "next/link";
import LocationCard from "@/components/LocationCard";
import Mark from "@/components/Mark";
import { site } from "@/lib/site";
import { week } from "@/lib/menu";

export const metadata = {
  title: "Pastrami Joe’s | New York style deli in Marshall and Battle Creek",
  description:
    "Hot pastrami and Sy Ginsberg corned beef, cut to order. Marshall from 7am, Battle Creek for weekday lunch. Hours, menu, catering and online ordering.",
  alternates: { canonical: "/" },
};

const today = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "long" }).format(new Date());

export default function Home() {
  const soupToday = week.soups.find((s) => s.day === today());

  return (
    <>
      <section className="hero">
        {/* THE HERO PHOTOGRAPH IS THE LCP ELEMENT, AND IT MEASURED 3.9s.
            The first version served the full 1600x1600 208KB file to every
            device. On a throttled mobile profile, 1.6Mbps with 4x CPU, that put
            Largest Contentful Paint at 3,912ms against a 2.5s bar. The menu
            page, which has no hero, measured 772ms, which is what said the
            image was the whole cost.

            srcset lets a 390px phone take the 42KB copy instead. `sizes="100vw"`
            because this is full bleed at every width. Re-measure with
            tools/perf-check.mjs after touching any of it. */}
        <img
          className="hero-photo"
          src="/assets/pjs/reuben-1200.webp"
          srcSet="/assets/pjs/reuben-640.webp 640w, /assets/pjs/reuben-900.webp 900w, /assets/pjs/reuben-1200.webp 1200w, /assets/pjs/reuben.webp 1600w"
          sizes="100vw"
          width="1600"
          height="1600"
          alt="A hot sandwich on marble rye, cut in half and stacked, with kettle chips and a pickle spear."
          fetchPriority="high"
        />
        <div className="wrap hero-in">
          <span className="kicker">Marshall and Battle Creek, Michigan</span>
          <h1>
            Hot pastrami,
            <br />
            cut to order.
          </h1>
          <p className="lede" style={{ marginTop: 18 }}>
            Sy Ginsberg corned beef and pastrami out of Detroit, piled on rye, with
            the Reuben people drive in for. Two counters, one board, since 2003.
          </p>
          <div className="btnrow" style={{ marginTop: 28 }}>
            <Link className="btn big" href="/order">
              Order online
            </Link>
            <Link className="btn big ghost" href="/menu">
              See the menu
            </Link>
          </div>
          {/* The two open/closed badges that used to sit here are the same two
              badges in the strip at the very top of every page. One idea, one
              screen, twice. The strip is the one that stays, because it is on
              all eleven routes rather than only this one. */}
        </div>
      </section>

      <div className="checkrule" role="presentation" />

      <section>
        <div className="wrap">
          <div className="reveal">
            <span className="kicker">Two counters</span>
            <h2>Where we are, and when</h2>
            <p className="lede" style={{ marginTop: 12 }}>
              Marshall opens at seven and does breakfast and pizza. Battle Creek is a
              weekday lunch counter. The sandwich board is the same at both.
            </p>
          </div>
          <div className="grid g2 stagger" style={{ marginTop: 26 }}>
            {site.locations.map((l) => (
              <div key={l.slug} className="reveal">
                <LocationCard location={l} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="check" style={{ borderTop: "1px solid var(--green-line)", borderBottom: "1px solid var(--green-line)" }}>
        <div className="wrap">
          <div className="reveal">
            <span className="kicker">The three</span>
            <h2>What people come in for</h2>
          </div>
          <div className="grid g3 stagger" style={{ marginTop: 26 }}>
            <article className="card reveal card-lift">
              <img src="/assets/pjs/reuben-640.webp" loading="lazy" width="640" height="640" alt="A hot pastrami sandwich on rye, cut and stacked." style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
              <div style={{ padding: 20 }}>
                <h3>Joe&rsquo;s Famous Hot Pastrami</h3>
                <p className="small" style={{ marginTop: 8 }}>
                  Sy Ginsberg pastrami, dill pickles, dark mustard on rye. The one the
                  place is named for.
                </p>
              </div>
            </article>
            <article className="card reveal card-lift">
              <img src="/assets/pjs/grilled.webp" width="1400" height="934" alt="A grilled sandwich cut in half on green checkered deli paper." style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
              <div style={{ padding: 20 }}>
                <h3>PJ&rsquo;s Reuben</h3>
                <p className="small" style={{ marginTop: 8 }}>
                  Gold Label corned beef, swiss, sauerkraut and house russian on grilled
                  marble rye. Turkey if you want it.
                </p>
              </div>
            </article>
            <article className="card reveal card-lift">
              <img src="/assets/pjs/soup.webp" width="1080" height="1080" alt="A white bowl of soup on green checkered paper." style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
              <div style={{ padding: 20 }}>
                <h3>Soup, and the chili</h3>
                <p className="small" style={{ marginTop: 8 }}>
                  Chicken noodle and the award winning chili every day, plus a different
                  pot each weekday.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: "center", gap: 40 }}>
            <div className="reveal">
              <span className="kicker">This week</span>
              <h2>{soupToday ? `Today it is ${soupToday.soup.toLowerCase()}` : "The soup rotation"}</h2>
              <p className="lede" style={{ marginTop: 12 }}>
                {week.daily} The rest of the week changes, and so do the seasonal
                sandwiches.
              </p>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 20, display: "grid", gap: 8, maxWidth: 380 }}>
                {week.soups.map((s) => (
                  <li
                    key={s.day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--green-line)",
                      fontWeight: s.day === today() ? 800 : 400,
                    }}
                  >
                    <span>{s.day}</span>
                    <span>{s.soup}</span>
                  </li>
                ))}
              </ul>
              <div className="btnrow" style={{ marginTop: 22 }}>
                <Link className="btn ghost" href="/specials">
                  This week in full
                </Link>
              </div>
            </div>
            <img
              className="reveal"
              src="/assets/pjs/chips.webp"
              width="760"
              height="760"
              loading="lazy"
              alt="Bags of Zapp's and Dirty kettle chips in a basket on the counter."
              style={{ borderRadius: 18, border: "1px solid var(--green-line)", width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* NO `color: #fff` on this section. It had one, and the white h2 landed
          on the white card inside it at a contrast ratio of 1.00: the heading
          was in the DOM, selectable, and completely invisible. axe reported
          zero violations on this page because the section carries a
          background-image and axe declines to compute contrast over one, so it
          was found by walking every element's computed color against its
          painted background instead. Same class of fault as the 1.09 footer
          link in the house log. */}
      <section className="check-strong">
        <div className="wrap">
          <div
            className="card reveal"
            style={{ padding: "clamp(24px, 4vw, 44px)", maxWidth: 780, margin: "0 auto", textAlign: "center" }}
          >
            <span className="kicker">Catering</span>
            <h2>You make the memories. We&rsquo;ll make the food.</h2>
            <p className="lede" style={{ marginTop: 14, marginInline: "auto" }}>
              Sub and wrap trays at $7.00 a head, boxed lunches, salads by the ten, soup
              by the gallon, breakfast burritos and bagels. Tell us the date and we will
              call you back.
            </p>
            <div className="btnrow" style={{ marginTop: 24, justifyContent: "center" }}>
              <Link className="btn big" href="/catering">
                Catering menu and prices
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap narrow reveal markbig" style={{ textAlign: "center" }}>
          {/* Their mark at a size where it is a drawing of a man rather than a
              favicon. It tips once when it arrives and then holds still. The
              note in globals.css explains why he tips instead of waving. */}
          <Mark size={128} className="markhero" />
          <span className="kicker">Since 2003</span>
          <h2>The meat comes from Detroit</h2>
          <p className="lede" style={{ marginTop: 14, marginInline: "auto" }}>
            {site.supplier.name} has been curing corned beef and pastrami in Detroit
            since 1972. That is the Gold Label on the Reuben, and it is why people
            who grew up eating this in New York keep telling us it tastes right.
          </p>
          <div className="btnrow" style={{ marginTop: 22, justifyContent: "center" }}>
            <Link className="btn ghost" href="/about">
              More about the deli
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

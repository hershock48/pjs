import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "Pastrami Joe’s opened in Marshall in 2003 and has been cutting Sy Ginsberg corned beef and pastrami ever since. Two counters, one kitchen’s worth of recipes.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <section className="tight">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <span className="kicker">Since 2003</span>
              <h1>A deli, run like one</h1>
              <p className="lede" style={{ marginTop: 16 }}>
                Pastrami Joe&rsquo;s opened on North Jefferson in Marshall in 2003 and has
                been slicing the same corned beef ever since. Twenty-six seats, a case, a
                grill and a board that has grown a little every year.
              </p>
            </div>
            <img
              className="hero-photo"
              src="/assets/pjs/storefront.webp"
              width="1440"
              height="1080"
              alt="The Pastrami Joe’s storefront on North Jefferson Street in Marshall, awnings out and tables on the sidewalk."
            />
          </div>
        </div>
      </section>

      <div className="checkrule" role="presentation" />

      <section>
        <div className="wrap narrow">
          <h2>The meat</h2>
          <p style={{ marginTop: 14 }}>
            {site.supplier.name} has been curing corned beef and pastrami in Detroit since
            1972. The Gold Label is what goes on the Reuben and on Joe&rsquo;s Famous Hot
            Pastrami, and it is the reason people who grew up eating this on the East Coast
            keep telling us it tastes the way it is supposed to.
          </p>
          <p style={{ marginTop: 14 }}>
            The rest follows from that. Turkey is Michigan raised. The chicken salad, egg
            salad, coleslaw, pasta salad, Russian and ranch are made here. The rye is
            marbled and it gets grilled, because a Reuben that has not been on the grill is
            just a sandwich.
          </p>

          <h2 style={{ marginTop: 40 }}>Two counters</h2>
          <p style={{ marginTop: 14 }}>
            Marshall is the original. It opens at seven, so it does breakfast: sammys on a
            biscuit, grilled burritos, biscuits and gravy, and pizza later on.
          </p>
          <p style={{ marginTop: 14 }}>
            Battle Creek is a lunch counter on West Michigan Avenue, back downtown since
            2024, after the previous Battle Creek store closed. The sign there reads Little
            Joe&rsquo;s. Same meat, same recipes, twenty seats, weekdays only.
          </p>

          <div className="btnrow" style={{ marginTop: 26 }}>
            <Link className="btn" href="/locations">
              Both locations and hours
            </Link>
            <Link className="btn ghost" href="/charity">
              Dine to donate
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

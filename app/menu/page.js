import Link from "next/link";
import MenuList from "@/components/MenuList";
import { groupsFor, missingPrices } from "@/lib/menu";
import { site, bySlug } from "@/lib/site";

export const metadata = {
  title: "Menu",
  description:
    "The whole board: hot pastrami, Reubens, cold sandwiches, wraps, salads, pizza and soup. Filter by the Marshall or Battle Creek counter.",
  alternates: { canonical: "/menu" },
};

/**
 * ONE menu page, filtered, rather than two pages that drift apart.
 *
 * Their live site has /menu/ and /battlecreek/menu-battle-creek/. The two share
 * most of their items word for word and have already diverged in small ways
 * nobody intended. Here the filter is a query parameter, so both views are the
 * same file and a new item is one edit.
 */
export default async function MenuPage({ searchParams }) {
  const params = await searchParams;
  const at = typeof params?.at === "string" ? params.at : null;
  const location = at ? bySlug(at) : null;
  const slug = location?.slug ?? null;
  const groups = groupsFor(slug);
  const { missing, total } = missingPrices();

  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">The board</span>
          <h1>Menu</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Everything is made when you order it. Breakfast and pizza are Marshall only.
            Everything else is on both counters.
          </p>

          <nav aria-label="Filter the menu by location" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link className={`btn ${slug ? "ghost" : ""}`} href="/menu">
              Everything
            </Link>
            {site.locations.map((l) => (
              <Link key={l.slug} className={`btn ${slug === l.slug ? "" : "ghost"}`} href={`/menu?at=${l.slug}`}>
                {l.name}
              </Link>
            ))}
          </nav>

          {location && (
            <p className="small" style={{ marginTop: 14 }}>
              Showing what the {location.name} counter makes.{" "}
              <Link href={`/order?at=${location.slug}`}>Order from {location.name}</Link>
              .
            </p>
          )}

          {/* Placeholder data on a live site is a live problem. This says so on
              the page, not only in the README, and the number is computed rather
              than typed so it cannot go stale. */}
          {missing > 0 && (
            <div className="notice" style={{ marginTop: 22, maxWidth: 720 }}>
              <b>Prices are still to come on this concept.</b>
              {missing} of {total} items have no published price anywhere on the current
              website, so nothing has been invented here. Send the price list and every
              one of them fills in from a single file.
            </div>
          )}
        </div>
      </section>

      <MenuList groups={groups} slug={slug} />

      <section>
        <div className="wrap">
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <h3>Ready to eat</h3>
            <p className="small" style={{ marginTop: 8 }}>
              Pick a counter and order ahead, or call and we will have it wrapped.
            </p>
            <div className="btnrow" style={{ marginTop: 18, justifyContent: "center" }}>
              <Link className="btn" href="/order">
                Order online
              </Link>
              <Link className="btn ghost" href="/catering">
                Catering
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

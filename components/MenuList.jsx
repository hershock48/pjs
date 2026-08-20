import { site } from "@/lib/site";

const money = (n) => `$${n.toFixed(2)}`;

/**
 * The price cell.
 *
 * A null price renders as a labelled gap, not as blank space and not as a
 * number somebody made up. See the long note at the top of lib/menu.js: their
 * retail menus publish no prices, a placeholder price on another site in this
 * account was served to real customers, and a sandwich price is exactly the
 * kind of number that looks harmless and is not.
 *
 * The gap is deliberately a bit ugly. It should be impossible to launch past.
 */
function Price({ item }) {
  if (item.priceNote) return <span className="mprice">{item.priceNote}</span>;
  if (item.price == null) {
    return (
      <span className="mprice todo" title="Price not published by the restaurant">
        price to come
      </span>
    );
  }
  return <span className="mprice">{money(item.price)}</span>;
}

function Item({ item, slug }) {
  // An item allowed at only some locations, shown on the all-locations view.
  const only = !slug && item.at ? item.at.map((s) => site.locations.find((l) => l.slug === s)?.name).join(" and ") : null;

  return (
    <li className="mitem">
      <span className="mname">
        {item.name}
        {item.signature && <span className="tag sig">Signature</span>}
        {only && <span className="tag">{only} only</span>}
      </span>
      <Price item={item} />
      {item.desc && <span className="mdesc">{item.desc}</span>}
      {item.addon && <span className="maddon">{item.addon}</span>}
    </li>
  );
}

export default function MenuList({ groups, slug }) {
  return (
    <>
      {groups.map((g) => (
        <section key={g.id} id={g.id} className="tight" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <div className="reveal">
              <h2>{g.title}</h2>
              {g.note && (
                <p className="small" style={{ marginTop: 8, maxWidth: "62ch" }}>
                  {g.note}
                </p>
              )}
              {!slug && !g.at.includes("battle-creek") && (
                <p className="small" style={{ marginTop: 8 }}>
                  <span className="tag">Marshall only</span>
                </p>
              )}
            </div>

            {g.sections.map((s, i) => (
              <div key={s.title ?? i} className="card reveal" style={{ padding: "6px 22px 14px", marginTop: 18 }}>
                {s.title && (
                  <h3 style={{ fontSize: 17, marginTop: 16, letterSpacing: "0.09em" }}>{s.title}</h3>
                )}
                {s.note && (
                  <p className="small" style={{ marginTop: 6 }}>
                    {s.note}
                  </p>
                )}
                <ul style={{ listStyle: "none", padding: 0, margin: s.title || s.note ? "10px 0 0" : 0 }}>
                  {s.items.map((it) => (
                    <Item key={it.name} item={it} slug={slug} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

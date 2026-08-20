"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
 * It reads as an em rule with the words behind a title attribute rather than
 * the words themselves fifty-four times down the page. The honesty is not in
 * repeating the sentence on every line, it is in the counted notice at the top
 * of the page that says how many are missing. Fifty-four repetitions of "price
 * to come" scanned as a broken page rather than a careful one.
 */
function Price({ item }) {
  if (item.priceNote) return <span className="mprice">{item.priceNote}</span>;
  if (item.price == null) {
    return (
      <span className="mprice todo" title="Price not yet published by the restaurant">
        &mdash;
      </span>
    );
  }
  // Their printed menu prices a sandwich three ways: whole, half and wrap, and
  // a pizza two ways, 14" and 9". Showing only the whole price is how a menu
  // gets accused of being expensive, which is already the most common complaint
  // in their reviews. So every size their menu prints, this prints.
  return (
    <span className="mprice">
      {money(item.price)}
      {item.half != null && <span className="msize"> &frac12; {money(item.half)}</span>}
      {item.wrap != null && (
        <span className="msize"> {item.pizza ? '9" ' : "wrap "}{money(item.wrap)}</span>
      )}
    </span>
  );
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

/** The first item in a group that carries a photograph, or nothing. */
const groupPhoto = (g) => {
  for (const s of g.sections) for (const it of s.items) if (it.photo) return it;
  return null;
};

/** Name and description, lowercased once per keystroke rather than per item. */
const matches = (item, q) =>
  item.name.toLowerCase().includes(q) || (item.desc ?? "").toLowerCase().includes(q);

/**
 * The board, with a way through it.
 *
 * The first version of this page was 8,660px of near-identical cards with no
 * way to reach the bottom half except scrolling past the top half. It is their
 * whole menu, which is the right content; it was the navigation that was
 * missing. Two things fix it and both are here:
 *
 *   - a sticky row of section links, which is how a paper menu's headings work
 *   - a filter, because "do they do a veggie one" is a real question and
 *     scanning sixty-five items for the answer is not an answer
 *
 * The filter runs on what is already rendered. No request, no spinner, and with
 * JavaScript off the input never appears and every item is on the page, which
 * is the state the search engine and the reader-mode user get.
 */
export default function MenuList({ groups, slug }) {
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(groups[0]?.id ?? null);
  const navRef = useRef(null);

  useEffect(() => setReady(true), []);

  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((g) => ({
        ...g,
        sections: g.sections
          .map((s) => ({ ...s, items: s.items.filter((it) => matches(it, query)) }))
          .filter((s) => s.items.length),
      }))
      .filter((g) => g.sections.length);
  }, [groups, query]);

  const hits = useMemo(
    () => filtered.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0),
    [filtered]
  );

  // Which section the reader is in. rootMargin pulls the trigger line down to
  // just under the two sticky bars, so the chip highlights when the heading
  // reaches the place a reader actually reads from rather than when it touches
  // the top of the viewport behind the header.
  useEffect(() => {
    if (query) return;
    const els = groups.map((g) => document.getElementById(g.id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-140px 0px -70% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups, query]);

  // Keep the active chip in view in its own scroller, without scrolling the
  // page: block "nearest" is what stops this from yanking the document.
  useEffect(() => {
    const el = navRef.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <>
      <div className="menubar">
        <div className="wrap menubar-in">
          <nav className="menujump" aria-label="Menu sections" ref={navRef}>
            {groups.map((g) => (
              <a key={g.id} href={`#${g.id}`} aria-current={!query && active === g.id ? "true" : undefined}>
                {g.short ?? g.title}
              </a>
            ))}
          </nav>
          {ready && (
            <div className="menufind">
              <label className="sr" htmlFor="menu-q">
                Search the menu
              </label>
              <input
                id="menu-q"
                type="search"
                value={q}
                placeholder="Search the menu"
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {query && (
        <div className="wrap" style={{ paddingTop: 22 }}>
          <p className="small" role="status">
            {hits === 0 ? (
              <>
                Nothing on the board matches &ldquo;{q}&rdquo;.{" "}
                <button type="button" className="linkish" onClick={() => setQ("")}>
                  Show everything
                </button>
              </>
            ) : (
              <>
                {hits} {hits === 1 ? "item" : "items"} matching &ldquo;{q}&rdquo;.{" "}
                <button type="button" className="linkish" onClick={() => setQ("")}>
                  Show everything
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {filtered.map((g) => (
        <section key={g.id} id={g.id} className="tight" style={{ paddingBottom: 0, scrollMarginTop: 132 }}>
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

            {/* Their own photography, at the group it belongs to.
                `photo` and `photoAlt` were already on the items in lib/menu.js
                and nothing rendered them: nine real photographs sat in the repo
                and the longest page on the site was the only page with no
                picture on it. Read off the items rather than duplicated onto
                the group, so a photo moves when its sandwich moves. */}
            {!query && groupPhoto(g) && (
              <figure className="menushot reveal">
                <img
                  src={groupPhoto(g).photo}
                  alt={groupPhoto(g).photoAlt}
                  width="1400"
                  height="934"
                  loading="lazy"
                />
                <figcaption className="small">{groupPhoto(g).name}</figcaption>
              </figure>
            )}
          </div>
        </section>
      ))}
    </>
  );
}

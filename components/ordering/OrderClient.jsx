"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * The guest ordering flow: pick a counter, build a cart, check out.
 *
 * THIS COMPONENT NEVER MENTIONS THE BUSINESS MODEL. No "our own website", no
 * fee split, no comparison to anybody's vendor. A guest gets a menu, a pickup
 * time and a plainly labelled fee, exactly like any other checkout. That story
 * belongs in the owner's proposal and nowhere a customer can read it.
 *
 * The state endpoint is polled rather than read once. A counter closing, a
 * kitchen pausing, or an item selling out all have to reach a page that has
 * been open in a tab since lunchtime, and the failure mode of not polling is a
 * guest paying for something nobody is going to make.
 */

const money = (c) => `$${(c / 100).toFixed(2)}`;

function lineKey(itemId, options) {
  return `${itemId}::${[...options].sort().join("|")}`;
}

/**
 * Does this item's listed price buy the smallest version of it?
 *
 * Their board prices a sandwich whole, half and wrap, and the generated
 * catalogue makes the CHEAPEST size the base with every other size as an
 * upcharge, because option prices cannot be negative. That is correct
 * arithmetic and it was a lie on the page: the hot pastrami listed at "$8.99",
 * which is the half, with nothing saying so. A guest scanning the board reads
 * that as the price of a sandwich and finds out at the sheet that it is not —
 * which is precisely the quoted-one-price-charged-another complaint the whole
 * proposal is about, reproduced by us.
 *
 * True when a REQUIRED group has any choice that costs more, which is exactly
 * the case where the number below the name is not the whole story. An optional
 * "add extra cheese" group does not make a price a starting price.
 */
const startsAt = (item) =>
  (item.options ?? []).some((g) => g.required && g.choices.some((c) => c.priceCents > 0));

export default function OrderClient({ sections, locations, hours }) {
  const hoursOf = (slug) => hours?.[slug] ?? "";

  const [at, setAt] = useState(locations[0]?.slug ?? "");
  const [state, setState] = useState(null);
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(null); // item being configured
  const [chosen, setChosen] = useState([]);
  const [qty, setQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);
  const [guest, setGuest] = useState({ guestName: "", guestPhone: "", guestEmail: "", note: "", wantedAt: "" });

  // Poll the state endpoint. 20s is often enough that a sold-out item is caught
  // before checkout and rare enough that an idle tab is not a load problem.
  useEffect(() => {
    let live = true;
    const pull = async () => {
      try {
        const r = await fetch("/api/ordering/state", { cache: "no-store" });
        const d = await r.json();
        if (live) setState(d);
      } catch {
        /* a failed poll keeps the last known state rather than blanking the page */
      }
    };
    pull();
    const t = setInterval(pull, 20000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  // Preselect a counter that can actually take an order, once, when the first
  // state arrives. Landing a guest on a counter that shut at three and making
  // them work out why is the whole reason this exists.
  useEffect(() => {
    if (!state) return;
    setAt((current) => {
      const still = state.locations.find((l) => l.slug === current);
      if (still?.open) return current;
      return state.locations.find((l) => l.open)?.slug ?? current;
    });
  }, [state]);

  const here = state?.locations.find((l) => l.slug === at) ?? null;
  const unavailable = new Set(state?.unavailable ?? []);

  /* ---------------------------- one board per counter ----------------------
   * Marshall makes pizza and breakfast and Battle Creek does not, and the two
   * stores print different combo deals. The server sends the whole board with
   * an `at` on every item and this filters it, so switching counters is instant
   * and needs no round trip. The order route filters again from the same field
   * before it prices anything: this is the convenience, not the enforcement.
   * An item with no `at` is served at both. */
  const servedHere = (i) => !i.at || i.at.includes(at);

  const visible = useMemo(
    () =>
      sections
        .map((s) => ({ ...s, items: s.items.filter(servedHere) }))
        .filter((s) => s.items.length > 0),
    [sections, at]
  );

  const atOf = useMemo(
    () => new Map(sections.flatMap((s) => s.items.map((i) => [i.id, i.at ?? null]))),
    [sections]
  );

  /* Switching counters with a Marshall pizza in the cart used to leave it
   * there, invisible on a board that no longer lists it, until the server
   * refused the whole order at checkout with a message about an item that is
   * "no longer on the menu". Prune on the switch and say what went, which is
   * the difference between a rule and an ambush. */
  const [dropped, setDropped] = useState([]);
  useEffect(() => {
    const gone = cart.filter((l) => {
      const a = atOf.get(l.itemId);
      return a && !a.includes(at);
    });
    if (!gone.length) return;
    setCart((c) => c.filter((l) => !gone.includes(l)));
    setDropped(gone.map((l) => l.name));
  }, [at, cart, atOf]);

  const chooseCounter = (slug) => {
    setDropped([]);
    setAt(slug);
  };
  const isCatering = (name) => name.toLowerCase().startsWith("catering");
  const cartIsCatering = cart.length > 0 && cart.every((l) => isCatering(l.section));
  const cartIsCounter = cart.length > 0 && cart.every((l) => !isCatering(l.section));

  const subtotal = cart.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const feeCents = state?.feeCents ?? 99;
  const taxCents = Math.round((subtotal + feeCents) * (state?.taxRate ?? 0.06));
  const total = subtotal + feeCents + taxCents;

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const canOrder = cart.length > 0 && (cartIsCatering || (here?.open ?? false));

  // What the open sheet currently costs per unit, options included, recomputed
  // as they are picked. Display only; the server re-prices everything anyway.
  const sheetUnitCents = open
    ? open.priceCents +
      open.options
        .flatMap((g) => g.choices)
        .filter((ch) => chosen.includes(ch.name))
        .reduce((sum, ch) => sum + ch.priceCents, 0)
    : 0;

  function beginAdd(item, section) {
    setOpen({ ...item, section });
    setChosen([]);
    // A "per person" or "serves 10" item defaults to 1 and reads as one tray.
    // Nobody caters for one person. Two is still a number they will change, but
    // it is not a number that silently books a $7 lunch for a party of forty.
    setQty(item.unit && /person|serves|five/i.test(item.unit) ? 10 : 1);
  }

  // The sheet is a dialog and has to behave like one: focus moves in, Escape
  // closes, the backdrop closes, the page behind stops scrolling, and Tab does
  // not walk out of it. None of this is what axe checks, and all of it is what
  // makes a modal feel broken.
  const sheetRef = useRef(null);
  const openerRef = useRef(null);
  const cartRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const node = sheetRef.current;
    const previouslyFocused = document.activeElement;
    openerRef.current = previouslyFocused;

    const focusables = () =>
      [...(node?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])].filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
    focusables()[0]?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(null);
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Focus goes back to the item that opened it, not to the top of the page.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  function toggle(group, choiceName) {
    setChosen((prev) => {
      if (group.multi) {
        return prev.includes(choiceName) ? prev.filter((c) => c !== choiceName) : [...prev, choiceName];
      }
      const others = prev.filter((c) => !group.choices.some((x) => x.name === c));
      return prev.includes(choiceName) ? others : [...others, choiceName];
    });
  }

  function confirmAdd() {
    const item = open;
    for (const g of item.options) {
      const picked = g.choices.filter((c) => chosen.includes(c.name));
      if (g.required && picked.length === 0) {
        setError(`${item.name} needs a ${g.name.toLowerCase()} picked.`);
        return;
      }
      if (!g.multi && picked.length > 1) return;
    }
    const optionCents = item.options
      .flatMap((g) => g.choices)
      .filter((c) => chosen.includes(c.name))
      .reduce((s, c) => s + c.priceCents, 0);
    const key = lineKey(item.id, chosen);
    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [
        ...prev,
        {
          key,
          itemId: item.id,
          section: item.section,
          name: item.name,
          options: [...chosen],
          unitCents: item.priceCents + optionCents,
          qty,
        },
      ];
    });
    setOpen(null);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setPlacing(true);
    setError("");
    try {
      const r = await fetch("/api/ordering/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...guest,
          locationSlug: at,
          tipCents: 0,
          lines: cart.map((l) => ({ itemId: l.itemId, qty: l.qty, options: l.options })),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "That did not go through.");
        return;
      }
      setPlaced(d);
      setCart([]);
    } catch {
      setError("The order did not reach the counter. Try again, or call.");
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <div className="card" style={{ padding: 26, maxWidth: 620 }}>
        <span className="kicker">Order #{placed.number}</span>
        <h2 style={{ fontSize: 30 }}>
          {placed.kind === "catering" ? "We have it" : `Ready in about ${placed.quotedMinutes} minutes`}
        </h2>
        <p className="lede" style={{ marginTop: 12 }}>
          {placed.kind === "catering"
            ? `Someone from ${placed.locationName} will call to confirm the details.`
            : `Come to the ${placed.locationName} counter and give them the number.`}
        </p>
        <p className="small" style={{ marginTop: 14 }}>
          Total {money(placed.totals.totalCents)}.{" "}
          {state?.demo ? "Nothing was charged: this is a demonstration." : "Paid online."}
        </p>
        <div className="btnrow" style={{ marginTop: 20 }}>
          <button className="btn ghost" type="button" onClick={() => setPlaced(null)}>
            Order something else
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ordergrid">
      <div>
        {/* Counter picker. Both are always shown, including a shut one, because
            "why can't I order from Battle Creek" is answered by seeing it say
            so rather than by it being missing. */}
        <div className="counterpick" role="group" aria-label="Which counter">
          {(state?.locations ?? locations).map((l) => (
            <button
              key={l.slug}
              type="button"
              className={`counterbtn ${at === l.slug ? "on" : ""}`}
              aria-pressed={at === l.slug}
              onClick={() => chooseCounter(l.slug)}
            >
              <b>{l.name}</b>
              <span className={`small ${l.open ? "isopen" : "isshut"}`}>
                {l.demoNote
                  ? l.demoNote
                  : l.open
                  ? `Taking orders until ${l.until}`
                  : "Not taking orders"}
              </span>
              {/* The counter's actual opening hours, which are NOT the ordering
                  window: ordering stops twenty minutes before the door does.
                  Somebody collecting food needs the door time, and the proposal
                  says this page shows it. */}
              <span className="small counterhours">{hoursOf(l.slug)}</span>
            </button>
          ))}
        </div>

        {here && !here.open && (
          <div className="notice" style={{ marginTop: 16 }}>
            <b>{here.name} is not taking counter orders right now.</b>
            {here.reason} Catering still goes through at any hour, because it is booked ahead.
          </div>
        )}

        {dropped.length > 0 && (
          <div className="notice" style={{ marginTop: 16 }} role="status">
            <b>{dropped.length === 1 ? "One item came out of your cart." : `${dropped.length} items came out of your cart.`}</b>{" "}
            {dropped.join(", ")} {dropped.length === 1 ? "is" : "are"} not served at this counter.
          </div>
        )}

        {visible.map((s) => (
          <section key={s.name} className="tight" style={{ paddingBottom: 0 }}>
            <h2 style={{ fontSize: 26 }}>{s.name}</h2>
            <div className="orderitems">
              {s.items.map((i) => {
                const off = unavailable.has(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    className={`orderitem ${off ? "off" : ""}`}
                    disabled={off}
                    onClick={() => beginAdd(i, s.name)}
                  >
                    <span className="oi-name">
                      {i.name}
                      {off && <span className="tag">Sold out</span>}
                    </span>
                    <span className="oi-price">
                      {startsAt(i) && <span className="oi-from">from </span>}
                      {money(i.priceCents)}
                      {i.unit ? <span className="oi-unit"> {i.unit}</span> : null}
                    </span>
                    {i.desc && <span className="oi-desc">{i.desc}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <p className="small" style={{ marginTop: 26 }}>
          Bakery, pastries and the cold drinks are counter only for now. Everything
          else on the <Link href="/menu">menu page</Link> can be ordered here.
        </p>
      </div>

      {/* THE STICKY CART BAR, MOBILE ONLY, AND THE MOST IMPORTANT THING HERE.
          Measured on a 390x844 phone: after adding an item the cart panel sits
          3,437px down the page. Nothing on screen changed. A guest taps Add, the
          sheet closes, and the only evidence the order exists is three screens
          below the fold, so they tap Add again. This bar is the receipt. */}
      {cart.length > 0 && (
        <div className="cartbar">
          <div className="cartbar-in">
            <span>
              <b>
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </b>
              <span className="small"> {money(total)}</span>
            </span>
            <button
              type="button"
              className="btn"
              onClick={() => {
                cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                // Focus the first field so a keyboard or screen-reader user is
                // taken there too, not just the viewport.
                setTimeout(() => cartRef.current?.querySelector("input")?.focus(), 500);
              }}
            >
              Review order
            </button>
          </div>
        </div>
      )}

      {/* Cart */}
      <aside className="cart" ref={cartRef}>
        <div className="card" style={{ padding: 20 }}>
          <h3>Your order</h3>
          {cart.length === 0 ? (
            <p className="small" style={{ marginTop: 10 }}>
              Nothing in it yet.
            </p>
          ) : (
            <>
              <ul className="cartlines">
                {cart.map((l) => (
                  <li key={l.key}>
                    <span>
                      <b>
                        {l.qty} x {l.name}
                      </b>
                      {l.options.length > 0 && <span className="small"> {l.options.join(", ")}</span>}
                    </span>
                    <span>
                      {money(l.unitCents * l.qty)}
                      <button
                        type="button"
                        className="linkish"
                        style={{ marginLeft: 10 }}
                        onClick={() => setCart((prev) => prev.filter((x) => x.key !== l.key))}
                      >
                        remove
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>{state?.feeLabel ?? "99¢ order fee"}</dt>
                  <dd>{money(feeCents)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>{money(taxCents)}</dd>
                </div>
                <div className="grand">
                  <dt>Total</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>

              <form onSubmit={submit} style={{ marginTop: 16 }}>
                <div className="fields">
                  <label>
                    <span>Name</span>
                    <input
                      required
                      autoComplete="name"
                      value={guest.guestName}
                      onChange={(e) => setGuest({ ...guest, guestName: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={guest.guestPhone}
                      onChange={(e) => setGuest({ ...guest, guestPhone: e.target.value })}
                    />
                  </label>
                </div>
                <label style={{ display: "block", marginTop: 12 }}>
                  <span>Email for a receipt, optional</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={guest.guestEmail}
                    onChange={(e) => setGuest({ ...guest, guestEmail: e.target.value })}
                  />
                </label>
                {cartIsCatering && (
                  <label style={{ display: "block", marginTop: 12 }}>
                    <span>What day do you need it</span>
                    <input
                      required
                      type="date"
                      value={guest.wantedAt}
                      onChange={(e) => setGuest({ ...guest, wantedAt: e.target.value })}
                    />
                  </label>
                )}
                <label style={{ display: "block", marginTop: 12 }}>
                  <span>Anything the counter should know</span>
                  <textarea
                    rows={2}
                    value={guest.note}
                    onChange={(e) => setGuest({ ...guest, note: e.target.value })}
                  />
                </label>

                {error && (
                  <p className="small" role="alert" style={{ color: "var(--red)", marginTop: 12 }}>
                    {error}
                  </p>
                )}

                <button className="btn big" type="submit" disabled={!canOrder || placing} style={{ marginTop: 16, width: "100%" }}>
                  {placing ? "Sending" : cartIsCatering ? "Book this catering" : `Order for pickup, ${money(total)}`}
                </button>

                {state?.demo && (
                  <p className="small" style={{ marginTop: 10 }}>
                    Demonstration checkout. No card is taken and nothing is charged.
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </aside>

      {/* Option sheet */}
      {open && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label={open.name}
          onMouseDown={(e) => {
            // Only a click that both starts AND ends on the backdrop closes it.
            // Using onClick alone closes the dialog when a drag inside it
            // happens to finish on the backdrop, which loses the guest's picks.
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="sheet-in card" ref={sheetRef} onMouseDown={(e) => e.stopPropagation()}>
            <h3>{open.name}</h3>
            {open.desc && (
              <p className="small" style={{ marginTop: 6 }}>
                {open.desc}
              </p>
            )}
            {open.options.map((g) => (
              <fieldset key={g.name} style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
                <legend style={{ fontWeight: 700, fontSize: 14 }}>
                  {g.name}
                  {g.required ? "" : ", optional"}
                  {g.multi ? ", pick any" : ""}
                </legend>
                <div className="choices">
                  {g.choices.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`choice ${chosen.includes(c.name) ? "on" : ""}`}
                      aria-pressed={chosen.includes(c.name)}
                      onClick={() => toggle(g, c.name)}
                    >
                      {c.name}
                      {c.priceCents > 0 && <span className="small"> +{money(c.priceCents)}</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="sheetfoot">
              <label className="qtyfield">
                <span className="small">{open.unit ? `How many, ${open.unit}` : "How many"}</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              {/* The running total, in the dialog. Without it a guest picks
                  options and taps Add having never seen what it costs, and the
                  first number they see is the cart. */}
              <p className="sheettotal">
                <span className="small">Adds to your order</span>
                <b>{money(sheetUnitCents * qty)}</b>
              </p>
            </div>
            <div className="btnrow" style={{ marginTop: 16 }}>
              <button className="btn" type="button" onClick={confirmAdd}>
                Add {money(sheetUnitCents * qty)}
              </button>
              <button className="btn ghost" type="button" onClick={() => setOpen(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

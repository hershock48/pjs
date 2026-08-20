"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The counter's screen: the ticket queue, the 86 board, the busy dial, and the
 * pause. Ported from the Beans build.
 *
 * THIS IS A WORKING SCREEN, NOT A DASHBOARD. Everything on it is one tap, the
 * text is large enough to read from arm's length with flour on your hands, and
 * nothing is behind a menu. The three things a counter actually does mid-rush
 * are accept, mark done, and say "we are out of that".
 *
 * The memory-backend warning is deliberate and stays. On deployed serverless
 * without a database, orders land on whichever lambda answered and this screen
 * can simply miss them. A demo that half-works silently is worse than one that
 * says what is wrong.
 */

const money = (c) => `$${(c / 100).toFixed(2)}`;

function since(ms) {
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}

export default function KitchenClient({ locations, initialAuthed = false }) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState(null);
  const [backend, setBackend] = useState("memory");
  const [menuDoc, setMenuDoc] = useState(null);
  const [tab, setTab] = useState("tickets");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const known = useRef(new Set());

  const pull = useCallback(async () => {
    const [o, s] = await Promise.all([
      fetch("/api/kitchen/orders", { cache: "no-store" }),
      fetch("/api/kitchen/state", { cache: "no-store" }),
    ]);
    if (o.status === 401) {
      setAuthed(false);
      return;
    }
    const od = await o.json();
    const sd = await s.json();
    setOrders(od.orders ?? []);
    setBackend(od.backend ?? "memory");
    setState(sd.state ?? null);
    setAuthed(true);

    // A new ticket makes a noise, because nobody watches a screen. Built from
    // the Web Audio API rather than an mp3: no asset, no autoplay policy
    // problem beyond the first interaction, nothing to host.
    for (const ord of od.orders ?? []) {
      if (!known.current.has(ord.id)) {
        if (known.current.size > 0) chime();
        known.current.add(ord.id);
      }
    }
  }, []);

  // Only poll once we know we are in. Polling while locked fired a 401 every
  // eight seconds into the console of a page whose normal state is locked.
  useEffect(() => {
    if (!authed) return;
    pull().catch(() => {});
    const t = setInterval(() => pull().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [pull, authed]);

  function chime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.55);
    } catch {
      /* a silent kitchen is survivable; a crash is not */
    }
  }

  async function login(e) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/kitchen/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!r.ok) {
      setError("Wrong PIN.");
      return;
    }
    setPin("");
    setAuthed(true);
    pull().catch(() => {});
  }

  async function move(id, status) {
    await fetch("/api/kitchen/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    pull().catch(() => {});
  }

  async function setBoard(patch) {
    const r = await fetch("/api/kitchen/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    setState(d.state ?? state);
  }

  async function loadMenu() {
    const r = await fetch("/api/kitchen/menu", { cache: "no-store" });
    const d = await r.json();
    setMenuDoc(d.doc ?? null);
  }

  if (!authed) {
    return (
      <form className="card" style={{ padding: 24, maxWidth: 380 }} onSubmit={login}>
        <h2 style={{ fontSize: 26 }}>Counter</h2>
        <p className="small" style={{ marginTop: 8 }}>
          Staff screen. Enter the PIN.
        </p>
        <label style={{ display: "block", marginTop: 14 }}>
          <span>PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </label>
        {error && (
          <p className="small" role="alert" style={{ color: "var(--red)", marginTop: 10 }}>
            {error}
          </p>
        )}
        <button className="btn" type="submit" style={{ marginTop: 16 }}>
          Open the board
        </button>
      </form>
    );
  }

  const shown = orders.filter((o) => filter === "all" || o.locationSlug === filter);
  const items = menuDoc ? menuDoc.flatMap((s) => s.items.map((i) => ({ ...i, section: s.name }))) : [];
  const off = new Set(state?.unavailable ?? []);

  return (
    <div>
      {backend === "memory" && (
        <div className="notice" style={{ marginBottom: 18, borderLeftColor: "var(--red)" }}>
          <b>Running without a database.</b>
          Orders are held in one server instance only, so this screen can miss tickets that
          landed elsewhere. Add a Postgres database and set DATABASE_URL before using this
          for real.
        </div>
      )}

      <div className="btnrow" style={{ marginBottom: 18 }}>
        <button className={`btn ${tab === "tickets" ? "" : "ghost"}`} onClick={() => setTab("tickets")}>
          Tickets ({orders.length})
        </button>
        <button className={`btn ${tab === "board" ? "" : "ghost"}`} onClick={() => setTab("board")}>
          Sold out and timing
        </button>
        <button
          className={`btn ${tab === "menu" ? "" : "ghost"}`}
          onClick={() => {
            setTab("menu");
            if (!menuDoc) loadMenu();
          }}
        >
          Menu
        </button>
      </div>

      {tab === "tickets" && (
        <>
          <div className="btnrow" style={{ marginBottom: 14 }}>
            <button className={`btn ghost ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>
              Both counters
            </button>
            {locations.map((l) => (
              <button
                key={l.slug}
                className={`btn ghost ${filter === l.slug ? "on" : ""}`}
                onClick={() => setFilter(l.slug)}
              >
                {l.name}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="lede">Nothing waiting.</p>
          ) : (
            <div className="tickets">
              {shown.map((o) => (
                <article key={o.id} className={`ticket ${o.status}`}>
                  <header>
                    <b>#{o.number}</b>
                    <span className="tag">{o.locationName}</span>
                    {o.kind === "catering" && <span className="tag sig">Catering {o.wantedAt}</span>}
                    <span className="small">{since(o.createdAt)}</span>
                  </header>
                  <p className="small">
                    {o.guestName} &middot; {o.guestPhone}
                  </p>
                  <ul>
                    {o.lines.map((l, n) => (
                      <li key={n}>
                        <b>
                          {l.qty} x {l.name}
                        </b>
                        {l.options.length > 0 && <span className="small"> {l.options.join(", ")}</span>}
                      </li>
                    ))}
                  </ul>
                  {o.note && <p className="small notegap">Note: {o.note}</p>}
                  <p className="small">
                    {money(o.totalCents)} &middot; {o.paid ? "Paid online" : "Due at pickup"}
                  </p>
                  <div className="btnrow">
                    {o.status === "new" && (
                      <button className="btn" onClick={() => move(o.id, "accepted")}>
                        Start it
                      </button>
                    )}
                    {o.status === "accepted" && (
                      <button className="btn" onClick={() => move(o.id, "done")}>
                        Done
                      </button>
                    )}
                    <button className="btn ghost" onClick={() => move(o.id, "refunded")}>
                      Cancel
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "board" && state && (
        <div className="card" style={{ padding: 22 }}>
          <h3>How long are you quoting</h3>
          <div className="btnrow" style={{ marginTop: 12 }}>
            {[0, 15, 30].map((m) => (
              <button
                key={m}
                className={`btn ${state.busyMinutes === m ? "" : "ghost"}`}
                onClick={() => setBoard({ busyMinutes: m })}
              >
                {m === 0 ? "Normal" : `+${m} min`}
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: 26 }}>Pause online orders</h3>
          <p className="small" style={{ marginTop: 6 }}>
            Always with a timer. It turns itself back on.
          </p>
          <div className="btnrow" style={{ marginTop: 12 }}>
            {[10, 20, 30, 60].map((m) => (
              <button key={m} className="btn ghost" onClick={() => setBoard({ pauseMinutes: m })}>
                {m} min
              </button>
            ))}
            {state.pausedUntil && (
              <button className="btn" onClick={() => setBoard({ pauseMinutes: 0 })}>
                Resume now
              </button>
            )}
          </div>

          <h3 style={{ marginTop: 26 }}>Sold out today</h3>
          {!menuDoc && (
            <button className="btn ghost" style={{ marginTop: 12 }} onClick={loadMenu}>
              Load the list
            </button>
          )}
          {menuDoc && (
            <div className="eightysix">
              {items.map((i) => (
                <button
                  key={i.id}
                  className={`choice ${off.has(i.id) ? "on" : ""}`}
                  aria-pressed={off.has(i.id)}
                  onClick={() => {
                    const next = off.has(i.id)
                      ? [...off].filter((x) => x !== i.id)
                      : [...off, i.id];
                    setBoard({ unavailable: next });
                  }}
                >
                  {i.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "menu" && (
        <div className="card" style={{ padding: 22 }}>
          <h3>The menu</h3>
          <p className="small" style={{ marginTop: 8 }}>
            This is the live menu. Edits here change what customers can order, straight
            away. Prices are in dollars.
          </p>
          {!menuDoc ? (
            <p className="small" style={{ marginTop: 12 }}>
              Loading.
            </p>
          ) : (
            <MenuEditor doc={menuDoc} onSaved={(d) => setMenuDoc(d)} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Deliberately a small editor, not a menu builder. Name, description, price,
 * hidden. Option groups are shown read-only because a broken option group
 * misprices every order that uses it, and that is a change worth a phone call
 * rather than a stray tap on a busy Saturday.
 */
function MenuEditor({ doc, onSaved }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(doc)));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function edit(si, ii, patch) {
    setDraft((d) => {
      const next = JSON.parse(JSON.stringify(d));
      Object.assign(next[si].items[ii], patch);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/kitchen/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc: draft }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) {
      setMsg(d.error || "That did not save.");
      return;
    }
    setMsg("Saved. Customers see it now.");
    onSaved(draft);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {draft.map((s, si) => (
        <section key={s.name} style={{ marginTop: 18 }}>
          <h4 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 17 }}>{s.name}</h4>
          {s.items.map((i, ii) => (
            <div key={i.id} className="editrow">
              <input
                aria-label={`Name of ${i.name}`}
                value={i.name}
                onChange={(e) => edit(si, ii, { name: e.target.value })}
              />
              <input
                aria-label={`Price of ${i.name}`}
                inputMode="decimal"
                value={(i.priceCents / 100).toFixed(2)}
                onChange={(e) => {
                  const cents = Math.round(Number(e.target.value.replace(/[^0-9.]/g, "")) * 100);
                  edit(si, ii, { priceCents: Number.isFinite(cents) ? cents : 0 });
                }}
              />
              <label className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!!i.hidden}
                  onChange={(e) => edit(si, ii, { hidden: e.target.checked })}
                  style={{ width: "auto" }}
                />
                Hidden
              </label>
            </div>
          ))}
        </section>
      ))}
      <div className="btnrow" style={{ marginTop: 20 }}>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving" : "Save the menu"}
        </button>
        {msg && <span className="small">{msg}</span>}
      </div>
    </div>
  );
}

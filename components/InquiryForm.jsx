"use client";

import { useState } from "react";
import { site } from "@/lib/site";

/**
 * A form with no mail service behind it, handled honestly.
 *
 * There is no SMTP mailbox and no API key on this build, because it is a concept
 * and nothing paid gets added to a client site without the client hearing the
 * cost. What is NOT acceptable is a stub that waits half a second and says
 * "Thanks, we got it" while sending nowhere. So this composes a mailto: with
 * every field already filled in and hands it to the visitor's own mail client,
 * and it says out loud that that is what it is doing.
 *
 * At launch this becomes a server action posting through a mailbox Pastrami
 * Joe's already owns, and the visitor-facing behavior stops mentioning mail
 * clients. The swap is one file. Until then nobody is told their message
 * arrived somewhere it did not.
 */
export default function InquiryForm({ kind = "catering", to = site.email }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k) => String(f.get(k) ?? "").trim();

    const lines = [
      `Name: ${get("name")}`,
      `Phone: ${get("phone")}`,
      `Email: ${get("email")}`,
      `Location: ${get("location")}`,
      kind === "catering" ? `Date: ${get("date")}` : null,
      kind === "catering" ? `Time: ${get("time")}` : null,
      kind === "catering" ? `Guests: ${get("guests")}` : null,
      kind === "catering" ? `Service: ${get("service")}` : null,
      "",
      get("message"),
    ].filter((l) => l !== null);

    const subject = kind === "catering" ? `Catering inquiry, ${get("date") || "date to confirm"}` : "Website inquiry";
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  }

  return (
    /*
     * action, method and enctype are set even though onSubmit calls
     * preventDefault and never uses them. THEY ARE THE NO-JAVASCRIPT PATH.
     * Without them the submit button did nothing at all with scripting off:
     * `glaze/launch.md` requires that every form still submits, and this one
     * silently did not. The native mailto POST is cruder than the composed one
     * above, fields as plain text rather than a formatted body, but it reaches
     * the same mailbox instead of reaching nothing.
     */
    <form
      className="card"
      style={{ padding: 22 }}
      onSubmit={onSubmit}
      action={`mailto:${to}`}
      method="post"
      encType="text/plain"
    >
      <div className="notice" style={{ marginBottom: 18 }}>
        <b>This is a concept build.</b>
        Submitting opens your own mail app with everything filled in, so nothing is
        lost and nothing pretends to have been delivered. On the live site this posts
        straight to the deli.
      </div>

      {/* Scripting off, and a mail client is not a given either. The phone
          numbers are the fallback that always works, and for a deli they are
          the better action anyway. */}
      <noscript>
        <div className="notice" style={{ marginBottom: 18 }}>
          <b>Easier to call.</b>
          {site.locations.map((l) => (
            <span key={l.slug} style={{ display: "block" }}>
              {l.name}: <a href={`tel:${l.phone.tel}`}>{l.phone.display}</a>
            </span>
          ))}
        </div>
      </noscript>

      <div className="fields">
        <label>
          <span>Your name</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" required autoComplete="tel" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          <span>Which counter</span>
          <select name="location" defaultValue={site.locations[0].name}>
            {site.locations.map((l) => (
              <option key={l.slug}>{l.name}</option>
            ))}
          </select>
        </label>

        {kind === "catering" && (
          <>
            <label>
              <span>Event date</span>
              <input name="date" type="date" required />
            </label>
            <label>
              <span>Time</span>
              <input name="time" type="time" required />
            </label>
            <label>
              <span>How many people</span>
              <input name="guests" type="number" min="1" inputMode="numeric" required />
            </label>
            <label>
              <span>Service</span>
              <select name="service" defaultValue="Trays">
                <option>Trays</option>
                <option>Boxed lunches</option>
                <option>Appetizers or charcuterie</option>
                <option>Breakfast</option>
                <option>Not sure yet</option>
              </select>
            </label>
          </>
        )}
      </div>

      <label style={{ display: "block", marginTop: 14 }}>
        <span>Anything else</span>
        <textarea name="message" rows={4} />
      </label>

      {/* One footnote per kind, because this line is a promise about what
          happens next and the three forms promise different things. The
          catering sentence sat under all three for a while, telling somebody
          requesting a Dine to Donate date that a call would "go through the
          menu", which is not what that call is. */}
      <p className="small" style={{ margin: "14px 0 16px" }}>
        {kind === "catering" &&
          "Sending this does not place an order. Somebody calls you back to go through the menu and confirm it."}
        {kind === "charity" &&
          "Sending this does not book the date. Somebody calls you back to pick a day that works for both of us."}
        {kind === "general" &&
          "If it is about an order for today, call the counter instead. This inbox is read between rushes."}
      </p>

      <button className="btn big" type="submit">
        {kind === "catering" ? "Start the catering inquiry" : "Send"}
      </button>

      {sent && (
        <p role="status" className="small" style={{ marginTop: 12 }}>
          Your mail app should have opened with the message ready. If it did not, call{" "}
          <a href={`tel:${site.locations[0].phone.tel}`}>{site.locations[0].phone.display}</a>.
        </p>
      )}
    </form>
  );
}

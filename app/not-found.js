import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section>
      <div className="wrap narrow" style={{ textAlign: "center", padding: "40px 0" }}>
        <img src="/assets/pjs/logo.svg" width="96" height="96" alt="" style={{ margin: "0 auto" }} />
        <h1 style={{ fontSize: "clamp(30px, 4vw, 46px)", marginTop: 22 }}>That one is not on the board</h1>
        <p style={{ marginTop: 16, color: "var(--muted)" }}>
          The page moved or never existed. The sandwiches are still where you left them.
        </p>
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn" href="/menu">
            See the menu
          </Link>
          <Link className="btn ghost" href="/locations">
            Hours and locations
          </Link>
        </div>
      </div>
    </section>
  );
}

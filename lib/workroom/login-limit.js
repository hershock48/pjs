/**
 * The login throttle: ten tries per address per ten minutes, then a wait.
 *
 * A four digit PIN has ten thousand values. Without a limit, a script walks
 * all of them in a minute. With one, it gets ten guesses per address per ten
 * minutes and stops being worth writing.
 *
 * WHERE THE COUNT LIVES. The order store (lib/ordering/store.js) runs on
 * Postgres when DATABASE_URL is set and in memory when it is not, and memory
 * is a supported production state for orders because the kitchen screen says
 * so in red. The throttle does NOT follow that rule, on purpose:
 *
 *   - With a database, attempts are rows in kitchen_login_attempts, shared by
 *     every lambda, surviving deploys. Same SQL as the DeVine workroom.
 *   - Without one, in development only, attempts live in a bounded Map on
 *     globalThis. It caps at 4096 addresses so a flood of spoofed sources
 *     cannot grow it without bound; past the cap, new addresses are refused.
 *   - Without one, in production, sign-in refuses. A memory map on a fleet of
 *     lambdas is per instance, so a cold start or a deploy starts everyone at
 *     zero; and the 4096 cap turns into a lockout the moment one caller
 *     rotates through 4096 addresses in a window (one IPv6 /64 is plenty),
 *     because every new address then throws until the window passes. A
 *     throttle an attacker can either reset or jam is not one. Same stance as
 *     DeVine, copperac and Mike's Place: production counts in Postgres or not
 *     at all, and the route tells the owner which variable is missing.
 *
 * WHO THE CLIENT IS. Only a header the host overwrites at its edge can name
 * the caller. On Vercel that is x-vercel-forwarded-for. A self-hosted Node
 * server behind a proxy sets KITCHEN_TRUSTED_IP_HEADER to the one header that
 * proxy overwrites. A plain x-forwarded-for from an untrusted edge is a lie
 * the caller writes, so it is never read unless named. With no trusted header
 * in production the route fails closed and tells the owner in one sentence,
 * because a throttle keyed on a forgeable value is a throttle the attacker
 * turns off.
 */

import { createHash } from "node:crypto";
import { isIP } from "node:net";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;
const MEMORY_CAP = 4096;
const TRUSTED_HEADERS = ["x-vercel-forwarded-for", "x-forwarded-for", "x-real-ip"];

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function hasDatabase() {
  return connectionString() !== "";
}

/**
 * Production with no database is a configuration gap, not an outage, so the
 * throw carries a reason the route can turn into the owner's sentence. The
 * text mirrors DeVine's so every site in the account says the same thing.
 */
function databaseRequired() {
  const err = new Error("Persistent login throttling needs a database.");
  err.reason = "database_required";
  return err;
}

/** Memory counters are a development convenience. See the header for why. */
function memoryAllowed() {
  if (process.env.NODE_ENV === "production") throw databaseRequired();
  return true;
}

/**
 * A hashed, canonical client address, or a throw when none can be trusted.
 * IPv6 goes through the URL parser so the same address in two spellings
 * counts as one client.
 */
export function loginClient(req) {
  const configured = process.env.KITCHEN_TRUSTED_IP_HEADER;
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : configured;
  if (header && !TRUSTED_HEADERS.includes(header)) {
    throw new Error("Invalid trusted client-address configuration.");
  }
  if (!header) {
    // `next dev` on a laptop has no proxy and no header. Loopback is the one
    // address that cannot be spoofed from outside, so it stands in.
    const host = new URL(req.url).hostname;
    if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(host)) {
      return "local-loopback";
    }
    throw new Error("Trusted client address unavailable.");
  }
  const raw = (req.headers.get(header) ?? "").trim();
  if (!isIP(raw)) throw new Error("Trusted client address unavailable.");
  const canonical = isIP(raw) === 6 ? new URL("http://[" + raw + "]/").hostname : raw;
  return createHash("sha256").update(canonical).digest("hex");
}

// --- memory -----------------------------------------------------------------

function buckets() {
  const g = globalThis;
  if (!g.__pjsLoginBuckets) g.__pjsLoginBuckets = new Map();
  return g.__pjsLoginBuckets;
}

function allowInMemory(key, now) {
  const map = buckets();
  for (const [id, bucket] of map) if (now - bucket.started >= WINDOW_MS) map.delete(id);
  if (!map.has(key) && map.size >= MEMORY_CAP) throw new Error("Sign-in capacity reached.");
  const old = map.get(key);
  const bucket = old && now >= old.started && now - old.started < WINDOW_MS ? old : { started: now, attempts: 0 };
  // Clamp before adding so a long attack cannot push the counter toward
  // overflow; anything past the limit reads the same anyway.
  bucket.attempts = Math.min(bucket.attempts, LIMIT) + 1;
  map.set(key, bucket);
  return bucket.attempts <= LIMIT;
}

// --- postgres ---------------------------------------------------------------

async function pool() {
  const g = globalThis;
  if (!g.__pjsLoginPool) {
    // Its own small pool, not the store's, so a stuck order write cannot hold
    // the door shut and a login flood cannot starve the ticket queue.
    const { Pool } = await import("pg");
    const cs = connectionString();
    g.__pjsLoginPool = new Pool({
      connectionString: cs,
      // Same TLS rule as the store: Neon needs it, local postgres has none.
      ssl: cs.includes("localhost") ? undefined : { rejectUnauthorized: false },
      max: 2,
      connectionTimeoutMillis: 7000,
    });
  }
  if (!g.__pjsLoginSchema) {
    g.__pjsLoginSchema = g.__pjsLoginPool
      .query(
        "CREATE TABLE IF NOT EXISTS kitchen_login_attempts (id text PRIMARY KEY, attempts integer NOT NULL, started bigint NOT NULL); " +
          "CREATE INDEX IF NOT EXISTS kitchen_login_expiry ON kitchen_login_attempts(started)",
      )
      .catch((e) => {
        g.__pjsLoginSchema = undefined;
        throw e;
      });
  }
  await g.__pjsLoginSchema;
  return g.__pjsLoginPool;
}

async function allowInPostgres(key, now) {
  const db = await pool();
  await db.query("DELETE FROM kitchen_login_attempts WHERE started<=$1", [now - WINDOW_MS]);
  // One statement counts and returns, so two lambdas racing on the same
  // address cannot both see attempt ten.
  const result = await db.query(
    `INSERT INTO kitchen_login_attempts(id,attempts,started) VALUES($1,1,$2)
     ON CONFLICT(id) DO UPDATE SET
       attempts=CASE WHEN kitchen_login_attempts.started<=$3 THEN 1 ELSE LEAST(kitchen_login_attempts.attempts,$4)+1 END,
       started=CASE WHEN kitchen_login_attempts.started<=$3 THEN $2 ELSE kitchen_login_attempts.started END
     RETURNING attempts`,
    [key, now, now - WINDOW_MS, LIMIT],
  );
  return result.rows[0].attempts <= LIMIT;
}

// --- the two calls the route makes -----------------------------------------

/** Count one attempt for this client. True while it is still allowed to try. */
export async function allowLogin(client, now = Date.now()) {
  if (!client) throw new Error("Client identity required.");
  const key = "kitchen:" + client;
  if (hasDatabase()) return allowInPostgres(key, now);
  memoryAllowed();
  return allowInMemory(key, now);
}

/** A correct PIN wipes the count, so a typo earlier in the shift is forgotten. */
export async function clearLoginAttempts(client) {
  if (!client) throw new Error("Client identity required.");
  const key = "kitchen:" + client;
  if (!hasDatabase()) {
    memoryAllowed();
    buckets().delete(key);
    return;
  }
  await (await pool()).query("DELETE FROM kitchen_login_attempts WHERE id=$1", [key]);
}

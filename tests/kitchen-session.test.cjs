/**
 * Kitchen sign-in: the signed session, the constant-time PIN check, the
 * throttle, and the login route that ties them together.
 *
 * Run with `npm test` (node --test). Each module is transpiled to CommonJS
 * and run in its own vm context with a mocked `next/headers` cookie jar and
 * a mocked `NextResponse`, so the tests need no server, no browser and no
 * database. The memory throttle is what runs when DATABASE_URL is unset,
 * which is the state these tests pin.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const ts = require("typescript");
const test = require("node:test");
const assert = require("node:assert/strict");

const SECRET = "fixture-secret-".repeat(4);
const PIN = "2468";
const PROD = { NODE_ENV: "production", KITCHEN_PIN: PIN, KITCHEN_SESSION_SECRET: SECRET, VERCEL: "1" };

/** Transpile one repo file to CJS and run it with the given mocks and env. */
function load(file, mocks = {}, env = {}, cryptoImpl = crypto) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const out = ts.transpileModule(source, {
    fileName: "module.ts",
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const require_ = (name) => {
    if (name === "node:crypto") return cryptoImpl;
    if (name === "node:net") return require("node:net");
    if (Object.hasOwn(mocks, name)) return mocks[name];
    throw new Error("unmocked import: " + name);
  };
  new vm.Script(out).runInNewContext({
    module,
    exports: module.exports,
    require: require_,
    process: { env },
    Buffer,
    Date,
    URL,
    Request,
    console,
  });
  return module.exports;
}

/** A cookie jar that remembers the last set() call and its options. */
function jar() {
  const state = { value: undefined, last: null };
  return {
    state,
    get: () => (state.value === undefined ? undefined : { value: state.value }),
    set: (name, value, options) => {
      state.value = value;
      state.last = { name, value, options };
    },
  };
}

const NextResponse = {
  json: (body, init) => ({ status: init?.status ?? 200, body, headers: init?.headers ?? {} }),
};

const session = load("lib/workroom/session.ts");
const config = { KITCHEN_PIN_FALLBACK: "0105" };

function authWith(cookieJar, env = PROD, cryptoImpl = crypto) {
  return load(
    "lib/ordering/auth.js",
    { "next/headers": { cookies: async () => cookieJar }, "./config": config, "../workroom/session": session },
    env,
    cryptoImpl,
  );
}

function routeWith(auth, limiter) {
  return load(
    "app/api/kitchen/login/route.js",
    { "next/server": { NextResponse }, "@/lib/ordering/auth": auth, "@/lib/workroom/login-limit": limiter },
    PROD,
  );
}

function post(pin, address = "203.0.113.5") {
  return new Request("https://pastramijoes.com/api/kitchen/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-vercel-forwarded-for": address },
    body: JSON.stringify({ pin }),
  });
}

test("a forged cookie is rejected: bad signature, edited payload, and the old PIN-as-cookie scheme", async () => {
  const j = jar();
  const auth = authWith(j);
  const token = session.issueSession("staff", PIN, SECRET);

  j.state.value = token;
  assert.equal(await auth.isKitchenAuthed(), true, "the real token is accepted");

  j.state.value = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
  assert.equal(await auth.isKitchenAuthed(), false, "one flipped signature character fails");

  const [payload, signature] = token.split(".");
  const data = JSON.parse(Buffer.from(payload, "base64url"));
  data.expires += 1000;
  j.state.value = Buffer.from(JSON.stringify(data)).toString("base64url") + "." + signature;
  assert.equal(await auth.isKitchenAuthed(), false, "an edited payload with the old signature fails");

  j.state.value = session.issueSession("staff", PIN, "another-secret-of-thirty-two-chars!!");
  assert.equal(await auth.isKitchenAuthed(), false, "a token signed with a different secret fails");

  j.state.value = PIN;
  assert.equal(await auth.isKitchenAuthed(), false, "the old scheme's cookie, the PIN itself, no longer opens anything");
});

test("an expired cookie is rejected", async () => {
  const j = jar();
  const auth = authWith(j);
  const past = Date.now() - (session.SESSION_SECONDS + 60) * 1000;
  j.state.value = session.issueSession("staff", PIN, SECRET, past);
  assert.equal(await auth.isKitchenAuthed(), false);
  // The primitive agrees when asked directly with a clock.
  const now = 1_700_000_000_000;
  const token = session.issueSession("staff", PIN, SECRET, now);
  assert.equal(session.sessionRole(token, SECRET, { staff: PIN, owner: null }, now + 1000), "staff");
  assert.equal(session.sessionRole(token, SECRET, { staff: PIN, owner: null }, now + (session.SESSION_SECONDS + 1) * 1000), null);
});

test("a wrong PIN is rejected on the constant-time path, whatever its length", async () => {
  const calls = [];
  const spy = {
    ...crypto,
    timingSafeEqual: (a, b) => {
      calls.push([a.length, b.length]);
      return crypto.timingSafeEqual(a, b);
    },
  };
  const j = jar();
  const auth = authWith(j, PROD, spy);

  assert.equal(auth.pinMatches("9999"), false, "same length, wrong digits");
  assert.equal(auth.pinMatches("1"), false, "shorter than the PIN");
  assert.equal(auth.pinMatches(PIN + "0"), false, "longer than the PIN");
  assert.equal(auth.pinMatches(""), false, "empty never reaches the compare");
  assert.equal(auth.pinMatches(2468), false, "a number is not a PIN");
  assert.equal(auth.pinMatches(PIN), true);
  // Every real compare went through timingSafeEqual over equal, fixed-length
  // digests, so no length or prefix leaks through timing or through a throw.
  assert.equal(calls.length, 4);
  for (const [a, b] of calls) assert.deepEqual([a, b], [32, 32]);

  const limiter = load("lib/workroom/login-limit.js", {}, PROD);
  const route = routeWith(auth, limiter);
  const res = await route.POST(post("9999"));
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "Wrong PIN.");
  assert.equal(j.state.last, null, "no cookie is set on a wrong PIN");
});

test("the correct PIN sets a signed, expiring, httpOnly cookie that never carries the PIN, and rotates on every login", async () => {
  const j = jar();
  const auth = authWith(j);
  const limiter = load("lib/workroom/login-limit.js", {}, PROD);
  const route = routeWith(auth, limiter);

  const res = await route.POST(post(PIN));
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);

  const { name, value, options } = j.state.last;
  assert.equal(name, "pjs_kitchen");
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, session.SESSION_SECONDS);
  assert.equal(options.path, "/");
  assert.equal(value.includes(PIN), false, "the token is not the PIN and does not contain it");
  assert.equal(session.sessionRole(value, SECRET, { staff: PIN, owner: null }), "staff");
  assert.equal(await auth.isKitchenAuthed(), true);

  const first = value;
  await route.POST(post(PIN));
  assert.notEqual(j.state.last.value, first, "a second login replaces the token rather than reusing it");
  assert.equal(await auth.isKitchenAuthed(), true);
});

test("the eleventh attempt from one address is refused while another address still signs in", async () => {
  const limiter = load("lib/workroom/login-limit.js", {}, PROD);
  const t = 1_700_000_000_000;
  for (let i = 0; i < 10; i++) assert.equal(await limiter.allowLogin("a", t), true, "try " + (i + 1));
  assert.equal(await limiter.allowLogin("a", t), false, "try 11 is refused");
  assert.equal(await limiter.allowLogin("b", t), true, "a different address is untouched");
  assert.equal(await limiter.allowLogin("a", t + 10 * 60 * 1000), true, "the window passes and the address may try again");
  await limiter.clearLoginAttempts("b");
  assert.equal(await limiter.allowLogin("b", t), true);

  // The same rule through the route, keyed on the address Vercel writes.
  const j = jar();
  const auth = authWith(j);
  const route = routeWith(auth, load("lib/workroom/login-limit.js", {}, PROD));
  for (let i = 0; i < 10; i++) {
    const res = await route.POST(post("0000", "198.51.100.7"));
    assert.equal(res.status, 401, "wrong PIN " + (i + 1));
  }
  const blocked = await route.POST(post(PIN, "198.51.100.7"));
  assert.equal(blocked.status, 429, "the eleventh try is refused even with the right PIN");
  assert.equal(blocked.headers["Retry-After"], "600");
  assert.equal(j.state.last, null, "no cookie was set while throttled");

  const other = await route.POST(post(PIN, "198.51.100.8"));
  assert.equal(other.status, 200, "another address signs in");
  assert.equal(await auth.isKitchenAuthed(), true);
});

test("production fails closed without a session secret, and without a trusted address", async () => {
  const noSecret = authWith(jar(), { NODE_ENV: "production", KITCHEN_PIN: PIN, VERCEL: "1" });
  assert.equal(noSecret.kitchenSessionReady(), false);
  assert.equal(await noSecret.isKitchenAuthed(), false);
  const closed = routeWith(noSecret, load("lib/workroom/login-limit.js", {}, PROD));
  const res = await closed.POST(post(PIN));
  assert.equal(res.status, 503);
  assert.equal(res.body.reason, "unconfigured");

  // No Vercel header and no configured proxy header: the route says whose
  // problem it is, in one sentence, and signs nobody in.
  const env = { NODE_ENV: "production", KITCHEN_PIN: PIN, KITCHEN_SESSION_SECRET: SECRET };
  const j = jar();
  const auth = authWith(j, env);
  const limiter = load("lib/workroom/login-limit.js", {}, env);
  const route = load(
    "app/api/kitchen/login/route.js",
    { "next/server": { NextResponse }, "@/lib/ordering/auth": auth, "@/lib/workroom/login-limit": limiter },
    env,
  );
  const blind = await route.POST(post(PIN));
  assert.equal(blind.status, 503);
  assert.equal(blind.body.error, "Sign-in is off until the hosting settings let the site see your connection address.");
  assert.equal(j.state.last, null);

  // A spoofable header is never read unless the operator names it.
  const spoofed = new Request("https://pastramijoes.com/api/kitchen/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: JSON.stringify({ pin: PIN }),
  });
  assert.equal((await route.POST(spoofed)).status, 503);
});

test("outside production, a laptop signs in with nothing set", async () => {
  const env = { NODE_ENV: "development", KITCHEN_PIN: PIN };
  const j = jar();
  const auth = authWith(j, env);
  assert.equal(auth.kitchenSessionReady(), true, "a per-process secret stands in");
  const limiter = load("lib/workroom/login-limit.js", {}, env);
  const route = load(
    "app/api/kitchen/login/route.js",
    { "next/server": { NextResponse }, "@/lib/ordering/auth": auth, "@/lib/workroom/login-limit": limiter },
    env,
  );
  const local = new Request("http://localhost:3000/api/kitchen/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin: PIN }),
  });
  const res = await route.POST(local);
  assert.equal(res.status, 200);
  assert.equal(j.state.last.options.secure, false, "no secure flag on plain http in dev");
  assert.equal(await auth.isKitchenAuthed(), true);
});

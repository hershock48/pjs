/**
 * The orderable menu: database-backed and staff-editable.
 *
 * Ported from the Beans build. The shape and the caching argument are theirs:
 * the seed is loaded on first read of an empty database, every edit after that
 * belongs to the restaurant, and menu drift stops being our problem to sync
 * away and becomes their button to press.
 *
 * Two kinds of "off the menu", deliberately distinct:
 *   86'd     (kitchen state)  sold out today, shows greyed on the order page
 *   hidden   (menu editor)    off the menu entirely, invisible to guests
 *
 * Reads are cached in-process for ten seconds. Order validation and page
 * renders hit this constantly, edits happen a few times a week, and a lambda
 * serving a ten-second-old price is fine because the server re-prices every
 * order at submit time anyway.
 */

import { SEED_MENU } from "./seed";

const CACHE_MS = 10_000;

function cacheBag() {
  const g = globalThis;
  g.__pjsMenuCache ??= { cache: null };
  return g.__pjsMenuCache;
}

export function invalidateMenuCache() {
  cacheBag().cache = null;
}

export async function loadMenuDoc(store) {
  const bag = cacheBag();
  if (bag.cache && Date.now() - bag.cache.at < CACHE_MS) return bag.cache.doc;
  const fromDb = await store.getMenuDoc();
  const doc = fromDb ?? SEED_MENU;
  bag.cache = { doc, at: Date.now() };
  return doc;
}

// Not exported: guestMenu is the only caller and the only entry point worth
// having, because it is the one that filters hidden items for guests.
function toOrderable(doc, { includeHidden }) {
  return doc
    .map((s) => ({
      name: s.name,
      ageRestricted: s.ageRestricted,
      items: s.items
        .filter((i) => includeHidden || !i.hidden)
        .map((i) => ({
          id: i.id,
          section: s.name,
          name: i.name,
          desc: i.desc,
          priceCents: i.priceCents,
          unit: i.unit ?? "",
          options: (i.groups ?? []).map((g) => ({
            name: g.name,
            required: g.required,
            multi: g.multi,
            choices: g.choices,
          })),
          ageRestricted: s.ageRestricted,
          image: i.image ?? undefined,
        })),
    }))
    .filter((s) => s.items.length > 0 || includeHidden);
}

function buildIndex(sections) {
  return new Map(sections.flatMap((s) => s.items).map((i) => [i.id, i]));
}

/**
 * Guest-facing menu plus index, one call: what the order page renders and what
 * the order API validates against. Hidden items are simply not in it, so a
 * stale cart line referencing one fails the ordinary unknown-item check.
 */
export async function guestMenu(store) {
  const doc = await loadMenuDoc(store);
  const sections = toOrderable(doc, { includeHidden: false });
  return { sections, index: buildIndex(sections) };
}

/**
 * Validation for the editor's PUT: shape, uniqueness, sane numbers. Returns an
 * error sentence or null. Deliberately permissive about content, because it is
 * their menu, and strict about anything that would corrupt an order.
 */
export function validateMenuDoc(doc) {
  if (!Array.isArray(doc) || doc.length === 0) return "The menu cannot be empty.";
  const ids = new Set();
  for (const s of doc) {
    if (typeof s?.name !== "string" || !s.name.trim()) return "Every section needs a name.";
    if (typeof s.ageRestricted !== "boolean") return "Malformed section.";
    if (!Array.isArray(s.items)) return "Malformed section.";
    for (const i of s.items) {
      if (typeof i?.id !== "string" || !i.id) return "Malformed item id.";
      if (ids.has(i.id)) return `Duplicate item id: ${i.id}`;
      ids.add(i.id);
      if (typeof i.name !== "string" || !i.name.trim()) return "Every item needs a name.";
      if (!Number.isInteger(i.priceCents) || i.priceCents < 0 || i.priceCents > 100000)
        return `Price out of range on ${i.name}.`;
      if (typeof i.desc !== "string") return "Malformed description.";
      if (i.image != null && typeof i.image !== "string") return "Malformed photo URL.";
      const groups = i.groups ?? [];
      if (!Array.isArray(groups)) return "Malformed options.";
      for (const g of groups) {
        if (typeof g?.name !== "string" || !g.name.trim()) return `An option group on ${i.name} needs a name.`;
        if (typeof g.required !== "boolean" || typeof g.multi !== "boolean") return "Malformed option group.";
        if (!Array.isArray(g.choices) || g.choices.length === 0)
          return `Option group "${g.name}" on ${i.name} needs at least one choice.`;
        for (const c of g.choices) {
          if (typeof c?.name !== "string" || !c.name.trim()) return `A choice in "${g.name}" needs a name.`;
          if (!Number.isInteger(c.priceCents) || c.priceCents < 0 || c.priceCents > 100000)
            return `Choice price out of range in "${g.name}".`;
        }
      }
    }
  }
  return null;
}

/** Sections that are catering rather than counter, by name. */
export const isCateringSection = (name) => name.toLowerCase().startsWith("catering");

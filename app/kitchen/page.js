import KitchenClient from "@/components/ordering/KitchenClient";
import { isKitchenAuthed } from "@/lib/ordering/auth";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * The staff screen. Deliberately not in the site nav and deliberately noindex:
 * it is a working surface for the counter, not a page of the website.
 */
export const metadata = {
  title: "Counter",
  robots: { index: false, follow: false },
  alternates: { canonical: "/kitchen" },
};

/**
 * AUTH IS CHECKED ON THE SERVER, and the reason is not security, it is noise.
 *
 * The first version rendered the client unconditionally and let it discover it
 * was locked by polling: two 401s fired on every load of this page, which the
 * route auditor correctly reported as console errors and 4xx responses. A page
 * whose normal state produces console errors teaches everybody to ignore
 * console errors.
 *
 * The cookie is read here instead, so a locked visitor gets the PIN form and no
 * request at all. The API routes still check the cookie themselves; this is not
 * the gate, it is the reason the gate is quiet.
 */
export default async function Kitchen() {
  const authed = await isKitchenAuthed();
  return (
    <section className="tight">
      <div className="wrap">
        <KitchenClient
          initialAuthed={authed}
          locations={site.locations.map((l) => ({ slug: l.slug, name: l.name }))}
        />
      </div>
    </section>
  );
}

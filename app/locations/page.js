import LocationCard from "@/components/LocationCard";
import { site } from "@/lib/site";

export const metadata = {
  title: "Locations and hours",
  description:
    "Pastrami Joe's on North Jefferson in Marshall and Little Joe's on West Michigan in Battle Creek. Addresses, phone numbers and the hours for both.",
  alternates: { canonical: "/locations" },
};

export default function Locations() {
  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">Marshall and Battle Creek</span>
          <h1>Locations and hours</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Two counters about twelve miles apart. Marshall does breakfast, pizza and the
            full board. Battle Creek is lunch.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g2">
            {site.locations.map((l) => (
              <LocationCard key={l.slug} location={l} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

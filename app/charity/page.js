import InquiryForm from "@/components/InquiryForm";

export const metadata = {
  title: "Dine to donate",
  description:
    "Pastrami Joe’s donates 30% of proceeds from designated dates to a chosen cause. Request a date for your nonprofit, school or team.",
  alternates: { canonical: "/charity" },
};

export default function Charity() {
  return (
    <>
      <section className="tight">
        <div className="wrap narrow">
          <span className="kicker">Since 2012</span>
          <h1>Dine to donate</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Pick a date, tell your people, and we donate 30% of that day&rsquo;s proceeds
            to your cause. They eat lunch, you raise money.
          </p>
          <p style={{ marginTop: 16 }}>
            We have been doing this since 2012, alongside the Reuben Race that has run for
            the Fountain Clinic. Schools, teams, churches and nonprofits are all welcome to
            ask.
          </p>
        </div>
      </section>

      <div className="checkrule" role="presentation" />

      <section>
        <div className="wrap narrow">
          <h2>Request a date</h2>
          <p className="lede" style={{ marginTop: 12, marginBottom: 22 }}>
            Tell us who you are and roughly when. We will call you back to pick a day that
            works for both of us.
          </p>
          <InquiryForm kind="charity" />
        </div>
      </section>
    </>
  );
}

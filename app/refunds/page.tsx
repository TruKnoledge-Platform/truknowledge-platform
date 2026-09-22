import SiteFooter from "../site-footer";

export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2]">
      <article className="mx-auto max-w-2xl px-6 py-10">
        <a href="/" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to home
        </a>
        <h1
          className="mt-4 text-4xl text-[#E8A24A]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Refunds
        </h1>
        <p className="mt-3 text-sm text-[#9AA3B5]">Last updated 22 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#F3E6D2]/90">
          <h2 className="text-xl text-[#E8A24A]">Courses</h2>
          <p>
            If you paid for a course and could not open it, contact us within 14
            days and we will refund you or fix access.
          </p>
          <p>
            If you could open the course, the sale is final. Course material is
            digital and can be watched as soon as you enroll. A teacher may
            choose to refund you. That is the teacher’s choice, not a promise
            from TruKnowledge.
          </p>
          <p>Free courses have nothing to refund.</p>

          <h2 className="text-xl text-[#E8A24A]">Custom domains and Web App setup</h2>
          <p>
            A fee to connect a domain you already own can be refunded if we have
            not started the work. Once we have bought a domain name for you, or
            finished the connection, that fee is not refunded. Domain registries
            do not return the name.
          </p>
          <p>
            If none of your three name choices can be bought, we will offer other
            names or refund the “we buy the name” fee. We will not keep a fee for
            a name we did not buy.
          </p>

          <h2 className="text-xl text-[#E8A24A]">How to ask</h2>
          <p>
            Use <a href="/contact" className="text-[#E8A24A] hover:underline">Contact us</a>.
            Include the email on the account, the course name, and the date you
            paid. Refunds, when granted, go back to the same card through Stripe.
            Stripe’s own fee may not be returned to us; if we refund you in full,
            you receive the course price back.
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
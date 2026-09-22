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
          <h2 className="text-xl text-[#E8A24A]">Course enrollments</h2>
          <p>
            A course payment is for access to that course. If you have not opened
            a session, write to us through Contact us within 14 days of payment
            and we will refund the enrollment. Once a session has been opened,
            the payment is not refunded, unless the course page was clearly not
            what was sold or we cannot give you access.
          </p>
          <p>
            Free courses have nothing to refund. A teacher does not issue the
            refund. We do, through Stripe, back to the same card.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Custom domain and Web App names</h2>
          <p>
            A fee to connect a domain you already own can be refunded if we have
            not started the connection. Once the name is connected, that fee is
            not refunded.
          </p>
          <p>
            A fee for us to buy a domain name is not refunded after the name has
            been purchased. Domain registries do not give that money back. If
            none of your name choices can be bought, and you do not accept
            another name, we refund the fee because we did not buy one.
          </p>

          <h2 className="text-xl text-[#E8A24A]">How to ask</h2>
          <p>
            Use Contact us. Include the email on the account and the course or
            domain you paid for. We aim to answer within 48 hours. A refund, when
            approved, goes back through Stripe and can take several days to show
            on the card.
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
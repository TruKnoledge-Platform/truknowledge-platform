import SiteFooter from "../site-footer";

export default function TermsPage() {
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
          Terms of use
        </h1>
        <p className="mt-3 text-sm text-[#9AA3B5]">Last updated 22 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#F3E6D2]/90">
          <p>
            TruKnowledge is the website at truknowledge.center, including course
            pages, learner accounts, the teacher back office, and Web Apps. It is
            run by the operator of truknowledge.center (“we”, “us”). By creating
            an account or paying for a course, you agree to these terms.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Accounts</h2>
          <p>
            You must give a real email and keep your login to yourself. You are
            responsible for what happens on your account. We may pause or unlist
            an account, or remove a course, if it breaks these terms, the law, or
            these rules of use. An unlisted member can still log in to contact us.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Teachers</h2>
          <p>
            Joining as a teacher is free. There is no monthly fee. You set the
            price of each course, including free. You keep the share shown on the
            site. Today that is 85% of the sale. We keep 15%, plus Stripe’s card
            fee. We may change the platform fee for future sales. We will show the
            current fee on the site before you publish a paid course.
          </p>
          <p>
            You own your course: title, video, notes, files, and images. You give
            us permission to host, display, and deliver that material to people
            who enroll, including through a Web App link. You promise you have the
            right to teach and sell that material, and that it does not break
            copyright or anyone else’s rights.
          </p>
          <p>
            Payouts go through Stripe. Stripe may ask you to confirm your
            identity before money is sent. We do not hold your full card number.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Learners</h2>
          <p>
            A published course can be free or paid. Payment is for access to that
            course as offered: video, notes, and extras the teacher includes.
            Access is for you. Do not copy, resell, or share your login so others
            can take the course without paying.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Web Apps and domain names</h2>
          <p>
            Every course can have a TruKnowledge Web App address. A custom name
            (your own domain, or a name we buy for you) is a separate paid
            service. Prices are shown before you pay. After payment we aim to
            reply within 48 hours. Buying or connecting a domain can take longer
            than a course enrollment. See the Refunds page for what can be
            returned.
          </p>

          <h2 className="text-xl text-[#E8A24A]">What you may not post</h2>
          <p>
            No illegal content, no scams, no material that sexually exploits
            anyone, and no content that attacks people for who they are. We may
            remove a course or unlist an account that does this.
          </p>

          <h2 className="text-xl text-[#E8A24A]">The service can change</h2>
          <p>
            We may add, change, or remove features. We try to keep your courses
            available, but we do not promise the site will never be down. If we
            close TruKnowledge, we will give teachers a reasonable chance to
            download their material where we are able to.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Disputes</h2>
          <p>
            These terms are governed by the laws of the State of Colorado, USA.
            Questions go to the Contact page first. If a dispute cannot be
            settled that way, it will be handled in the state or federal courts
            located in Colorado.
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
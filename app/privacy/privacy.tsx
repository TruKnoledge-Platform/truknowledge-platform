import SiteFooter from "../site-footer";

export default function PrivacyPage() {
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
          Privacy
        </h1>
        <p className="mt-3 text-sm text-[#9AA3B5]">Last updated 22 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#F3E6D2]/90">
          <p>
            This page says what TruKnowledge collects, why, and who else sees it.
            The site is at truknowledge.center.
          </p>

          <h2 className="text-xl text-[#E8A24A]">What we store</h2>
          <p>When you use the site we store:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account email, and your name if you give one</li>
            <li>Courses you teach or enroll in, progress, reviews, and messages</li>
            <li>Payments: amount, course, and Stripe’s payment id. Not your full card number</li>
            <li>Country, when we can tell it, so a teacher can see where learners are</li>
            <li>Messages you send through Contact us</li>
            <li>Domain requests: the names you ask for, and whether they were paid</li>
          </ul>

          <h2 className="text-xl text-[#E8A24A]">Why</h2>
          <p>
            To run your account, deliver courses and Web Apps, take payment, pay
            teachers, show progress, and answer you. We do not sell your email
            list.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Who else handles it</h2>
          <p>
            Supabase stores the database and files. Stripe processes cards and
            teacher payouts. Vercel hosts the site. They only receive what they
            need to do that job.
          </p>
          <p>
            A teacher sees the learners enrolled in that teacher’s own courses:
            email, progress, and messages you opted in to. Other teachers do not.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Cookies</h2>
          <p>
            We use a sign-in cookie so you stay logged in, including on a course
            Web App under truknowledge.center. We do not run third-party ad
            trackers.
          </p>

          <h2 className="text-xl text-[#E8A24A]">How long</h2>
          <p>
            We keep account and payment records while the account is open and as
            long as tax or Stripe rules require. You can ask us to delete an
            account from the Contact page. We may keep a payment record even
            after the account is gone.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Children</h2>
          <p>
            TruKnowledge is not directed at children under 13. Do not create an
            account for a child under 13.
          </p>

          <h2 className="text-xl text-[#E8A24A]">Questions</h2>
          <p>
            Use the <a href="/contact" className="text-[#E8A24A] hover:underline">Contact</a> page.
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
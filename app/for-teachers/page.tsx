import { createClient } from "@/lib/supabase-server";

function money(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n)) || Number(n) <= 0) {
    return "contact us";
  }
  return `$${Number(n)}`;
}

export default async function ForTeachersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select(
      "fee_percent, price_cname_diy, price_cname_setup, price_domain_first, price_domain_extra"
    )
    .eq("id", 1)
    .maybeSingle();

  const fee = Number(settings?.fee_percent) || 15;
  const keep = 100 - fee;
  const startHref = user ? "/teacher" : "/signup";

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a
          href="/"
          className="text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Tru<span className="text-[#E8A24A]">Knowledge</span>
        </a>
        <nav className="flex items-center gap-5 text-sm text-[#9AA3B5]">
          <a href="/courses" className="hover:text-[#F3E6D2]">
            Courses
          </a>
          <a href="/for-teachers" className="text-[#E8A24A]">
            For teachers
          </a>
          {user ? (
            <a href="/teacher" className="hover:text-[#F3E6D2]">
              Teach
            </a>
          ) : (
            <a href="/login" className="hover:text-[#F3E6D2]">
              Log in
            </a>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">
          For those who teach
        </p>
        <h1
          className="mt-5 text-4xl leading-[1.15] md:text-5xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Course, Web App, and your own site.
          <span className="block text-[#E8A24A]">One back office.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[#F3E6D2]/80">
          Join free. Keep {keep}% of what you sell. Learners can find you on
          TruKnowledge, on a Web App link, or on a page you already own.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={startHref}
            className="rounded-full bg-[#E8A24A] px-8 py-3.5 text-base font-semibold text-[#0B1020] hover:bg-amber-300"
          >
            Start teaching — free
          </a>
          <a
            href="#package"
            className="rounded-full border border-[#E8A24A] px-8 py-3.5 text-base font-semibold text-[#E8A24A] hover:bg-[#E8A24A]/10"
          >
            See the full package
          </a>
        </div>
      </section>

      <div id="package" className="mx-auto max-w-3xl space-y-6 px-6 pb-20">
        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">A — What this is</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            People teaching people
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>You create the course in one back office</li>
            <li>The same course is also a Web App you can share</li>
            <li>If you have a website, the catalog can live on your page</li>
            <li>Payments go through Stripe — you are paid, we keep a platform fee</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">B — Who it is for</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Teachers, news casters, natural science — anyone sharing experience
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#F3E6D2]/85">
            If you already teach with your voice, this is the place to put the
            course, the extras, and the conversation — without a monthly software bill.
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">C — Money</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Join free. Keep {keep}%.
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>No monthly fee to create courses</li>
            <li>You keep {keep}% of each paid enrollment</li>
            <li>TruKnowledge keeps {fee}% , plus Stripe’s card fee</li>
            <li>Free courses stay free — no fee on $0</li>
            <li>Payouts go to your Stripe account when you connect it</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">D — One back office</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Build once. Change on the fly.
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>Title, price, sneak-peek video, thumbnail</li>
            <li>Sessions, with notes and extra materials on each</li>
            <li>Discussion with students, if you turn it on</li>
            <li>Who enrolled, and how far they have come</li>
            <li>Messages, with a badge when something is new</li>
            <li>Publish, unpublish, or delete</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">E — The Web App</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            The course is also an app
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>Same pages you already maintain — not a second project</li>
            <li>Share one link. Learners can add it to their home screen</li>
            <li>Works on iPhone, iPad, Mac, Windows, and Android</li>
            <li>When you edit the course, the Web App updates with it</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">F — Your own website</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Already have a site? Put the catalog there
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#F3E6D2]/85">
            WordPress or any page that accepts a simple embed. Learners see your
            courses on your page. They log in, sneak peek, and enroll without
            feeling sent away to a stranger’s school.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>You paste one block of code — or we can do that for you</li>
            <li>Payments still use TruKnowledge + Stripe</li>
            <li>You still keep {keep}% — this is not a way around the fee</li>
            <li>A small “Powered by TruKnowledge” stays on the catalog for now</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">G — Where each course is listed</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            You choose, course by course
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>
              <strong>Show on my site</strong> — appears on your website catalog
            </li>
            <li>
              <strong>Show on TruKnowledge</strong> — appears on truknowledge.center
            </li>
            <li>Both, one, or neither. Direct links still work if the course is published</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">H — Addresses</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Three ways people can reach the Web App
          </h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>
              <strong>Free address.</strong> You pick a short name.
              Example: name.truknowledge.center
            </li>
            <li>
              <strong>Your existing site, without moving the whole site.</strong>{" "}
              We point only a small address such as app.yoursite.com at your
              course. You add the setting yourself ({money(settings?.price_cname_diy)})
              or we do it ({money(settings?.price_cname_setup)}).
            </li>
            <li>
              <strong>We buy a domain for you.</strong> First course{" "}
              {money(settings?.price_domain_first)}. Each extra course on that
              same domain {money(settings?.price_domain_extra)}. Courses become
              folders, such as yourdomain.com/foundations
            </li>
          </ol>
          <p className="mt-4 text-sm text-[#9AA3B5]">
            After a paid address request, we reply within 48 hours.
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">I — For the learner</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Clear from first look to finished course
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>Sneak peek, then enroll — free or a stated price</li>
            <li>My courses: START · in progress · completed</li>
            <li>The course continues where they stopped</li>
            <li>Videos, notes, and extras come with the course</li>
            <li>Message / discussion with you, when you allow it</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">J — What you need</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Very little to begin
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>An email, to join</li>
            <li>Your teaching — video links, notes, files</li>
            <li>Stripe, when you want to be paid</li>
            <li>A website, only if you want the catalog on your own page</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">K — What you do not pay</p>
          <h2
            className="mt-3 text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            No monthly platform rent
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-7 marker:text-[#E8A24A]">
            <li>No charge to sign up or to draft a course</li>
            <li>No extra fee because the Web App is included</li>
            <li>The catalog on your own site is included, with TruKnowledge noted on the page</li>
            <li>Paid extras are only custom addresses, and only if you want them</li>
          </ul>
        </article>

        <article className="rounded-3xl bg-gradient-to-b from-amber-700/70 via-amber-950/25 to-transparent p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">L — Begin</p>
          <h2
            className="mt-3 text-3xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Start with one course
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[#F3E6D2]/85">
            Create it, publish it, share the Web App or put it on your site.
            You can add a custom address later.
          </p>
          <a
            href={startHref}
            className="mt-8 inline-flex rounded-full bg-[#E8A24A] px-8 py-3.5 text-base font-semibold text-[#0B1020] hover:bg-amber-300"
          >
            Start teaching — free
          </a>
          <p className="mt-4 text-sm">
            <a href="/contact" className="text-[#E8A24A] hover:underline">
              Questions? Contact us
            </a>
          </p>
        </article>
      </div>
    </main>
  );
}
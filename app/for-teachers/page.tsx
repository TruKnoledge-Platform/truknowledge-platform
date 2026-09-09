import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function money(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n)) || Number(n) <= 0) {
    return "contact us";
  }
  return `$${Number(n)}`;
}

export default async function TeacherGuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/teacher/guide");

  const { data: settings } = await supabase
    .from("platform_settings")
    .select(
      "fee_percent, price_cname_diy, price_cname_setup, price_domain_first, price_domain_extra"
    )
    .eq("id", 1)
    .maybeSingle();

  const fee = Number(settings?.fee_percent) || 15;
  const keep = 100 - fee;

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher home
        </a>
        <p className="mt-4 text-sm text-orange-400">Teacher office</p>
        <h1 className="mt-1 text-3xl font-semibold">What you can do</h1>
        <p className="mt-3 text-slate-400">
          One course. One back office. A Web App and, if you want, your own site.
        </p>

        <div className="mt-8 space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">A — Course</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>You create a course in the back office</li>
              <li>Each course has sessions, notes, extras, and messages</li>
              <li>You set the price. Free is allowed</li>
              <li>Publish when it is ready</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">B — Money</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>No monthly fee</li>
              <li>You keep {keep}% of each paid enroll</li>
              <li>TruKnowledge keeps {fee}%, plus Stripe’s card fee</li>
              <li>A free course has no fee</li>
              <li>Connect Stripe in Payouts to receive money</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">C — Back office</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>Create and edit the course</li>
              <li>Add sessions, notes, and extras</li>
              <li>See who enrolled and how far they have come</li>
              <li>Messages with learners</li>
              <li>Publish, unpublish, or delete</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">D — Web App</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>Every course is also a Web App</li>
              <li>Same course. Same back office. One link to share</li>
              <li>When you change the course, the Web App changes too</li>
              <li>Works on phone, tablet, and laptop</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">E — Your site</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>If you already have a website, your courses can show on that site</li>
              <li>Open My site in the back office and paste the code on your page</li>
              <li>Learners enroll on your site</li>
              <li>Stripe is still TruKnowledge Stripe. You still keep {keep}%</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">
              F — Where the course is shown
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>
                <strong>Show on my site</strong> — the course is on your website
              </li>
              <li>
                <strong>Show on TruKnowledge</strong> — the course is on
                truknowledge.center
              </li>
              <li>You can use one, both, or neither</li>
              <li>Set this on the course page after Publish</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">G — Web App link</p>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-200">
              <li>
                <strong>Free.</strong> A TruKnowledge link such as
                name.truknowledge.center
              </li>
              <li>
                <strong>Your site.</strong> Keep your website as it is. Point only
                a Web App link such as app.yoursite.com at the course. You do it (
                {money(settings?.price_cname_diy)}) or we do it (
                {money(settings?.price_cname_setup)})
              </li>
              <li>
                <strong>We buy a domain.</strong> First course{" "}
                {money(settings?.price_domain_first)}. Each extra course{" "}
                {money(settings?.price_domain_extra)}. Extra courses use the same
                domain, for example yourdomain.com/course-name
              </li>
            </ol>
            <p className="mt-3 text-sm text-slate-400">
              Paid Web App link requests: we reply within 48 hours.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">H — Learners</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
              <li>They enroll — free or the price you set</li>
              <li>START · in progress · completed</li>
              <li>The course continues where they stopped</li>
              <li>Sessions, notes, extras, and messages are in the course</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-orange-500/40 bg-[#111827] p-6">
            <p className="text-xs uppercase tracking-wide text-orange-400">I — Start</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Create a course. Publish it. Share the Web App or put it on your
              site. A domain can wait.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/teacher/new"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
              >
                Create a course
              </a>
              <a
                href="/teacher/site"
                className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
              >
                My site
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
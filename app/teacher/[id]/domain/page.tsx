import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { saveWebAppSlug } from "./actions";

export default async function TeacherDomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { err, ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, webapp_slug")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!course) notFound();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select(
      "price_cname_diy, price_cname_setup, price_domain_first, price_domain_extra"
    )
    .eq("id", 1)
    .maybeSingle();

  const diy = Number(settings?.price_cname_diy ?? 0);
  const setup = Number(settings?.price_cname_setup ?? 0);
  const first = Number(settings?.price_domain_first ?? 0);
  const extra = Number(settings?.price_domain_extra ?? 0);
  const money = (n: number) =>
    n > 0 ? `$${n.toFixed(2)}` : "Price not set yet";

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/teacher" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to teacher home
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Web App address
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">{course.title}</p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">
            Choice 1 — free
          </p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">A name on TruKnowledge</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>You type a short name (letters, numbers, hyphen).</li>
            <li>
              Learners open{" "}
              <span className="text-[#E8A24A]">name.truknowledge.center</span>
            </li>
            <li>No payment. The long /webapp/ link still works.</li>
            <li>If the name is taken, try another.</li>
          </ul>
          <form action={saveWebAppSlug} className="mt-6 flex flex-wrap items-end gap-3">
            <input type="hidden" name="courseId" value={id} />
            <label className="text-sm">
              Short name
              <input
                name="slug"
                required
                defaultValue={course.webapp_slug || ""}
                placeholder="neurofunc"
                className="mt-1 block w-56 rounded-lg bg-[#0B1020] px-3 py-2"
              />
            </label>
            <span className="pb-2 text-sm text-[#9AA3B5]">.truknowledge.center</span>
            <button
              type="submit"
              className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
            >
              Save name
            </button>
          </form>
          {err === "taken" && (
            <p className="mt-3 text-sm text-red-300">That name is taken.</p>
          )}
          {err === "name" && (
            <p className="mt-3 text-sm text-red-300">Enter a short name.</p>
          )}
          {ok && (
            <p className="mt-3 text-sm text-[#E8A24A]">Saved.</p>
          )}
          {course.webapp_slug && (
            <p className="mt-4 text-sm">
              Free address:{" "}
              <a
                className="text-[#E8A24A] underline"
                href={`https://${course.webapp_slug}.truknowledge.center`}
              >
                {course.webapp_slug}.truknowledge.center
              </a>
            </p>
          )}
          <p className="mt-2 text-xs text-[#9AA3B5]">
            Backup link: truknowledge.center/webapp/{id}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">
            Choice 2 — paid
          </p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">
            Keep your own site, add app.yoursite.com
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>Your homepage stays as it is.</li>
            <li>
              Learners type app.yoursite.com and stay on that address (CNAME).
            </li>
            <li>
              DIY: you add one line at your domain company — {money(diy)}
            </li>
            <li>We do it for you — {money(setup)}</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <p className="mt-4 text-sm text-[#9AA3B5]">
            Stripe checkout for this choice is next. Prices above are what
            you will pay.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">
            Choice 3 — paid
          </p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">
            We buy a domain for you
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>You list three names you want, in order.</li>
            <li>We check if we can buy one, then attach it to your Web Apps.</li>
            <li>
              First course on that domain — {money(first)}
            </li>
            <li>
              Each extra course on the same domain — {money(extra)}
            </li>
            <li>
              Courses look like yourdomain.com/foundations ,
              yourdomain.com/advanced
            </li>
            <li>If none of the three work, we suggest others. You tick or send three more.</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <p className="mt-4 text-sm text-[#9AA3B5]">
            Stripe and the three-name form are next.
          </p>
        </section>
      </div>
    </main>
  );
}
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { saveWebAppSlug, startDomainCheckout } from "./actions";

const KIND_WORDS: Record<string, string> = {
  cname_diy: "Choice 2 — you add the CNAME",
  cname_setup: "Choice 2 — we add the CNAME",
  domain_first: "Choice 3 — first course, we buy the domain",
  domain_extra: "Choice 3 — extra course on that domain",
};

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
    .select("id, title, webapp_slug, custom_host")
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

  const { data: orders } = await supabase
    .from("domain_orders")
    .select("id, kind, host, name1, name2, name3, amount, created_at")
    .eq("course_id", id)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const diy = Number(settings?.price_cname_diy ?? 0);
  const setup = Number(settings?.price_cname_setup ?? 0);
  const first = Number(settings?.price_domain_first ?? 0);
  const extra = Number(settings?.price_domain_extra ?? 0);
  const money = (n: number) => (n > 0 ? `$${n.toFixed(2)}` : "Price not set yet");
  const latest = orders?.[0];

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href={`/teacher/${id}`} className="text-sm text-[#9AA3B5] hover:text-white">
          Back to course
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Web App address
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">{course.title}</p>
        {latest && (
          <div className="mt-6 rounded-2xl border border-[#E8A24A]/40 bg-[#E8A24A]/10 p-5">
            <p className="text-sm font-medium text-[#E8A24A]">
              {course.custom_host ? "Your custom address is live" : "Payment received"}
            </p>
            {course.custom_host ? (
              <p className="mt-2 text-sm leading-6">
                Learners open{" "}
                <a className="text-[#E8A24A] underline" href={`https://${course.custom_host}`}>
                  {course.custom_host}
                </a>
                . Your main website is unchanged.
              </p>
            ) : latest.kind === "cname_diy" && latest.host ? (
              <div className="mt-2 text-sm leading-6">
                <p>
                  Add this at the company where you bought the domain (GoDaddy,
                  Namecheap, etc.). Your homepage stays as it is.
                </p>
                <p className="mt-3">
                  Type: <span className="text-[#E8A24A]">CNAME</span>
                  <br />
                  Name / Host:{" "}
                  <span className="text-[#E8A24A]">
                    {latest.host.replace(/^https?:\/\//, "").split(".")[0]}
                  </span>
                  <br />
                  Value / Points to:{" "}
                  <span className="text-[#E8A24A]">cname.vercel-dns.com</span>
                </p>
                <p className="mt-3 text-[#9AA3B5]">
                  We will reply within 48 hours when it is live. Thank you for
                  your patronage and patience.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6">
                We are working on this and will respond within 48 hours.
                Thank you for your patronage and patience.
              </p>
            )}
          </div>
        )}

        {err === "taken" && (
          <p className="mt-4 text-sm text-red-300">That name is taken.</p>
        )}
        {err === "name" && (
          <p className="mt-4 text-sm text-red-300">Enter a short name.</p>
        )}
        {err === "host" && (
          <p className="mt-4 text-sm text-red-300">
            Enter the address, like app.yoursite.com
          </p>
        )}
        {err === "names" && (
          <p className="mt-4 text-sm text-red-300">Enter three names, in order.</p>
        )}
        {err === "price" && (
          <p className="mt-4 text-sm text-red-300">
            This option has no price yet. Try again later.
          </p>
        )}
        {ok && <p className="mt-4 text-sm text-[#E8A24A]">Saved.</p>}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">Choice 1 — free</p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">A name on TruKnowledge</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>You type a short name (letters, numbers, hyphen).</li>
            <li>
              Learners open{" "}
              <span className="text-[#E8A24A]">name.truknowledge.center</span>
            </li>
            <li>No payment. The long /webapp/ link still works.</li>
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
          {course.webapp_slug && (
            <p className="mt-4 text-sm">
              Free address:{" "}
              <span className="text-[#E8A24A]">
                {course.webapp_slug}.truknowledge.center
              </span>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">Choice 2 — paid</p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">
            Keep your own site, add app.yoursite.com
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>Your homepage stays as it is.</li>
            <li>Learners type app.yoursite.com and stay on that address.</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <form action={startDomainCheckout} className="mt-6 space-y-4">
            <input type="hidden" name="courseId" value={id} />
            <label className="block text-sm">
              Address you want (example: app.yoursite.com)
              <input
                name="host"
                required
                placeholder="app.yoursite.com"
                className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="kind"
                value="cname_diy"
                disabled={diy <= 0}
                className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020] disabled:opacity-40"
              >
                I add the CNAME — {money(diy)}
              </button>
              <button
                type="submit"
                name="kind"
                value="cname_setup"
                disabled={setup <= 0}
                className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A] disabled:opacity-40"
              >
                You add it — {money(setup)}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <p className="text-xs uppercase tracking-wide text-[#E8A24A]">Choice 3 — paid</p>
          <h2 className="mt-2 text-xl text-[#E8A24A]">We buy a domain for you</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>List three names you want, in order.</li>
            <li>We try to buy one, then attach your Web Apps to it.</li>
            <li>Courses look like yourdomain.com/foundations</li>
            <li>If none work, we suggest others. You tick or send three more.</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <form action={startDomainCheckout} className="mt-6 space-y-3">
            <input type="hidden" name="courseId" value={id} />
            <label className="block text-sm">
              First choice
              <input
                name="name1"
                required
                className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Second choice
              <input
                name="name2"
                required
                className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Third choice
              <input
                name="name3"
                required
                className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                name="kind"
                value="domain_first"
                disabled={first <= 0}
                className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020] disabled:opacity-40"
              >
                First course — {money(first)}
              </button>
              <button
                type="submit"
                name="kind"
                value="domain_extra"
                disabled={extra <= 0}
                className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A] disabled:opacity-40"
              >
                Extra course — {money(extra)}
              </button>
            </div>
          </form>
        </section>

        {!!orders?.length && (
          <section className="mt-6 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg text-[#E8A24A]">Your requests</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="text-[#9AA3B5]">
                  <span className="text-[#F3E6D2]">
                    {KIND_WORDS[o.kind] || o.kind}
                  </span>
                  {" · "}${Number(o.amount).toFixed(2)}
                  {o.host ? ` · ${o.host}` : ""}
                  {o.name1
                    ? ` · ${[o.name1, o.name2, o.name3].filter(Boolean).join(", ")}`
                    : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  saveWebAppSlug,
  startDomainCheckout,
  pickSuggestedName,
  sendMoreNames,
} from "./actions";
import Choice2Form from "./choice-2-form";
import Choice3Form from "./choice-3-form";

const KIND_WORDS: Record<string, string> = {
  cname_diy: "Choice 2 — you add it",
  cname_setup: "Choice 2 — we add it",
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
    .select(
      "id, kind, host, name1, name2, name3, suggested1, suggested2, suggested3, chosen_domain, amount, status, created_at"
    )
    .eq("course_id", id)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const { data: teacherProf } = await supabase
    .from("teacher_profiles")
    .select("bought_domain")
    .eq("user_id", user.id)
    .maybeSingle();

  const diy = Number(settings?.price_cname_diy ?? 0);
  const setup = Number(settings?.price_cname_setup ?? 0);
  const first = Number(settings?.price_domain_first ?? 0);
  const extra = Number(settings?.price_domain_extra ?? 0);
  const money = (n: number) => (n > 0 ? `$${n.toFixed(2)}` : "Price not set yet");
  const latest = orders?.[0];
  const bought = teacherProf?.bought_domain || "";
  const cnameName = latest?.host
    ? latest.host.replace(/^https?:\/\//, "").split(".")[0]
    : "app";

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href={`/teacher/${id}`} className="text-sm text-slate-400 hover:text-white">
          Back to Manage course
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Create Unique Domain</h1>
        <p className="mt-2 text-sm text-slate-400">{course.title}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Every course already has a Web App. Here you choose the address
          people type to open it.
        </p>

        {latest && (
          <div className="mt-6 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5">
            <p className="text-sm font-medium text-orange-400">
              {course.custom_host || bought
                ? "Your custom address is live"
                : "Payment received"}
            </p>
            {course.custom_host ? (
              <p className="mt-2 text-sm leading-6">
                Learners open{" "}
                <a
                  className="text-orange-400 underline"
                  href={`https://${course.custom_host}`}
                >
                  {course.custom_host}
                </a>
                . Your main website is unchanged.
              </p>
            ) : latest.kind === "cname_diy" && latest.host && !course.custom_host ? (
              <div className="mt-2 text-sm leading-6">
                <p>
                  Add a sub-address on your existing domain. Do not change or
                  redirect the main website — only add this extra name.
                </p>
                <p className="mt-3">
                  If you are not sure how, ask your domain host, or choose
                  “We add it for you” next time.
                </p>
                <p className="mt-4 font-medium text-orange-400">What to add</p>
                <p className="mt-1">
                  Type: <span className="text-orange-400">CNAME</span>
                  <br />
                  Name / Host: <span className="text-orange-400">{cnameName}</span>
                  <br />
                  Value / Points to:{" "}
                  <span className="text-orange-400">cname.vercel-dns.com</span>
                </p>
                <p className="mt-4 text-slate-400">
                  We will reply within 48 hours when it is live.
                  <br />
                  Thank you for your patronage and patience.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6">
                We are working on this and will respond within 48 hours. Thank
                you for your patronage and patience.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              {KIND_WORDS[latest.kind] || latest.kind}
              {latest.host ? ` · ${latest.host}` : ""}
            </p>
          </div>
        )}

        {bought && (
          <div className="mt-6 rounded-2xl border border-orange-500/40 bg-[#111827] p-5 text-sm leading-6">
            <p className="font-medium text-orange-400">Your acquired domain is live</p>
            <p className="mt-2">
              All your courses:{" "}
              <a className="text-orange-400 underline" href={`https://${bought}`}>
                {bought}
              </a>
            </p>
            {course.webapp_slug && (
              <p>
                This course:{" "}
                <a
                  className="text-orange-400 underline"
                  href={`https://${bought}/${course.webapp_slug}`}
                >
                  {bought}/{course.webapp_slug}
                </a>
              </p>
            )}
          </div>
        )}

        {latest?.status === "waiting_choice" && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="text-xl font-medium">Those names were not available</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tick one we can acquire, or send three new names.
            </p>
            <form action={pickSuggestedName} className="mt-4 space-y-2 text-sm">
              <input type="hidden" name="courseId" value={id} />
              <input type="hidden" name="orderId" value={latest.id} />
              {[latest.suggested1, latest.suggested2, latest.suggested3]
                .filter(Boolean)
                .map((name) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="radio" name="pick" value={name || ""} required />
                    {name}
                  </label>
                ))}
              <button
                type="submit"
                className="mt-3 rounded-lg bg-orange-500 px-5 py-2 font-medium hover:bg-orange-600"
              >
                Acquire this one
              </button>
            </form>
            <form
              action={sendMoreNames}
              className="mt-8 space-y-3 border-t border-slate-800 pt-4"
            >
              <input type="hidden" name="courseId" value={id} />
              <input type="hidden" name="orderId" value={latest.id} />
              <p className="text-sm">Or send three new names:</p>
              <input
                name="name1"
                required
                className="block w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2"
              />
              <input
                name="name2"
                required
                className="block w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2"
              />
              <input
                name="name3"
                required
                className="block w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg border border-orange-500 px-5 py-2 text-orange-400"
              >
                Send three new names
              </button>
            </form>
          </div>
        )}

        {err === "taken" && (
          <p className="mt-4 text-sm text-red-400">That name is taken.</p>
        )}
        {err === "name" && (
          <p className="mt-4 text-sm text-red-400">Enter a short name.</p>
        )}
        {err === "reserved" && (
          <p className="mt-4 text-sm text-red-400">That short name is reserved.</p>
        )}
        {err === "host" && (
          <p className="mt-4 text-sm text-red-400">
            Use a sub-address like app.yoursite.com — not yoursite.com and not
            www.yoursite.com. That keeps your homepage as it is.
          </p>
        )}
        {err === "slugfirst" && (
          <p className="mt-4 text-sm text-red-400">
            Save a free short name (Choice 1) first. Extra courses use that as
            the folder: yourdomain.com/shortname
          </p>
        )}
        {err === "names" && (
          <p className="mt-4 text-sm text-red-400">Enter three names, in order.</p>
        )}
        {err === "price" && (
          <p className="mt-4 text-sm text-red-400">
            This option has no price yet. Try again later.
          </p>
        )}
        {err === "stripe" && (
          <p className="mt-4 text-sm text-red-400">Payment could not start.</p>
        )}
        {ok && <p className="mt-4 text-sm text-orange-400">Saved.</p>}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <p className="text-xs uppercase tracking-wide text-orange-400">
            Choice 1 — free
          </p>
          <h2 className="mt-2 text-xl font-medium">A name on TruKnowledge</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            <li>Type a short name (letters, numbers, hyphen).</li>
            <li>
              Learners open{" "}
              <span className="text-orange-400">name.truknowledge.center</span>
            </li>
            <li>No payment. Ready as soon as you save.</li>
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
                className="mt-1 block w-56 rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2"
              />
            </label>
            <span className="pb-2 text-sm text-slate-400">.truknowledge.center</span>
            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-5 py-2 font-medium hover:bg-orange-600"
            >
              Save name
            </button>
          </form>
          {course.webapp_slug && (
            <p className="mt-4 text-sm">
              Free address:{" "}
              <a
                className="text-orange-400 underline"
                href={`https://${course.webapp_slug}.truknowledge.center`}
              >
                {course.webapp_slug}.truknowledge.center
              </a>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <p className="text-xs uppercase tracking-wide text-orange-400">
            Choice 2 — paid
          </p>
          <h2 className="mt-2 text-xl font-medium">
            Keep your own site, add app.yoursite.com
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            <li>Must be a sub-address: app.yoursite.com (not yoursite.com).</li>
            <li>Your homepage stays as it is.</li>
            <li>Learners type that address and stay on it.</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <Choice2Form
            courseId={id}
            diyLabel={`I add it myself — ${money(diy)}`}
            setupLabel={`We add it for you — ${money(setup)}`}
            diyDisabled={diy <= 0}
            setupDisabled={setup <= 0}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <p className="text-xs uppercase tracking-wide text-orange-400">
            Choice 3 — paid
          </p>
          <h2 className="mt-2 text-xl font-medium">We buy a domain for you</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            <li>List three names you want, in order.</li>
            <li>We try to buy one, then attach your Web Apps to it.</li>
            <li>Courses look like yourdomain.com/foundations</li>
            <li>Extra course: save a free short name first (Choice 1).</li>
            <li>If none work, we suggest others. You tick or send three more.</li>
            <li>After payment we reply within 48 hours.</li>
          </ul>
          <Choice3Form
            courseId={id}
            hasSlug={!!course.webapp_slug}
            slug={course.webapp_slug || "shortname"}
            bought={bought}
            firstLabel={`First course — ${money(first)}`}
            extraLabel={`Extra course — ${money(extra)}`}
            firstDisabled={first <= 0}
            extraDisabled={extra <= 0}
          />
        </section>

        {!!orders?.length && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="text-lg font-medium">Your requests</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-400">
              {orders.map((o) => (
                <li key={o.id}>
                  <span className="text-white">
                    {KIND_WORDS[o.kind] || o.kind}
                  </span>
                  {" · "}${Number(o.amount).toFixed(2)}
                  {o.host ? ` · ${o.host}` : ""}
                  {o.name1
                    ? ` · ${[o.name1, o.name2, o.name3].filter(Boolean).join(", ")}`
                    : ""}
                  {o.status === "waiting_choice" ? " · waiting for your pick" : ""}
                  {o.status === "live" ? " · live" : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
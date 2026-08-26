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
              {course.custom_host || bought
                ? "Your custom address is live"
                : "Payment received"}
            </p>
            {course.custom_host ? (
              <p className="mt-2 text-sm leading-6">
                Learners open{" "}
                <a
                  className="text-[#E8A24A] underline"
                  href={`https://${course.custom_host}`}
                >
                  {course.custom_host}
                </a>
                . Your main website is unchanged.
              </p>
            ) : latest.kind === "cname_diy" && latest.host && !course.custom_host ? (
              <div className="mt-2 text-sm leading-6">
                <p>
                  Add this at the company where you bought the domain (GoDaddy,
                  Namecheap, etc.). Do not change your homepage.
                </p>
                <p className="mt-3">
                  Type: <span className="text-[#E8A24A]">CNAME</span>
                  <br />
                  Name / Host: <span className="text-[#E8A24A]">{cnameName}</span>
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
                We are working on this and will respond within 48 hours. Thank
                you for your patronage and patience.
              </p>
            )}
            <p className="mt-3 text-xs text-[#9AA3B5]">
              {KIND_WORDS[latest.kind] || latest.kind}
              {latest.host ? ` · ${latest.host}` : ""}
            </p>
          </div>
        )}

        {bought && (
          <div className="mt-6 rounded-2xl border border-[#E8A24A]/40 p-5 text-sm leading-6">
            <p className="font-medium text-[#E8A24A]">Your bought domain is live</p>
            <p className="mt-2">
              All your courses:{" "}
              <a className="text-[#E8A24A] underline" href={`https://${bought}`}>
                {bought}
              </a>
            </p>
            {course.webapp_slug && (
              <p>
                This course:{" "}
                <a
                  className="text-[#E8A24A] underline"
                  href={`https://${bought}/${course.webapp_slug}`}
                >
                  {bought}/{course.webapp_slug}
                </a>
              </p>
            )}
          </div>
        )}

        {latest?.status === "waiting_choice" && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#12182A] p-6">
            <h2 className="text-xl text-[#E8A24A]">Those names were not available</h2>
            <p className="mt-2 text-sm text-[#9AA3B5]">
              Tick one we can buy, or send three new names.
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
                className="mt-3 rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
              >
                Buy this one
              </button>
            </form>
            <form
              action={sendMoreNames}
              className="mt-8 space-y-3 border-t border-white/10 pt-4"
            >
              <input type="hidden" name="courseId" value={id} />
              <input type="hidden" name="orderId" value={latest.id} />
              <p className="text-sm">Or send three new names:</p>
              <input
                name="name1"
                required
                className="block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
              <input
                name="name2"
                required
                className="block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
              <input
                name="name3"
                required
                className="block w-full rounded-lg bg-[#0B1020] px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A]"
              >
                Send three new names
              </button>
            </form>
          </div>
        )}

        {err === "taken" && (
          <p className="mt-4 text-sm text-red-300">That name is taken.</p>
        )}
        {err === "name" && (
          <p className="mt-4 text-sm text-red-300">Enter a short name.</p>
        )}
        {err === "reserved" && (
          <p className="mt-4 text-sm text-red-300">That short name is reserved.</p>
        )}
        {err === "host" && (
          <p className="mt-4 text-sm text-red-300">
            Use a sub-address like app.yoursite.com — not yoursite.com and not
            www.yoursite.com. That keeps your homepage as it is.
          </p>
        )}
        {err === "slugfirst" && (
          <p className="mt-4 text-sm text-red-300">
            Save a free short name (Choice 1) first. Extra courses use that as
            the folder: yourdomain.com/shortname
          </p>
        )}
        {err === "names" && (
          <p className="mt-4 text-sm text-red-300">Enter three names, in order.</p>
        )}
        {err === "price" && (
          <p className="mt-4 
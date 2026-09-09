import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { saveTeacherSite } from "./actions";

export default async function TeacherSitePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const q = await searchParams;
  const { data: site } = await supabase
    .from("teacher_sites")
    .select("slug, display_name")
    .eq("teacher_id", user.id)
    .maybeSingle();

  const origin = "https://www.truknowledge.center";
  const publicUrl = site ? `${origin}/site/${site.slug}` : "";
  const embedUrl = site ? `${origin}/site/${site.slug}/embed` : "";
  const snippet = site
    ? `<iframe src="${embedUrl}" title="${site.display_name}" style="width:100%;min-height:900px;border:0;"></iframe>`
    : "";

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher home
        </a>
        <h1 className="mt-4 text-3xl font-semibold">My site</h1>
        <p className="mt-2 text-sm text-slate-400">
          One teacher. Only your courses. Learners stay on the page you give
          them. No door into TruKnowledge’s marketplace.
        </p>

        {q.saved && (
          <p className="mt-4 text-sm text-green-400">Saved.</p>
        )}
        {q.error === "taken" && (
          <p className="mt-4 text-sm text-red-400">
            That address is already used. Try another.
          </p>
        )}
        {q.error === "1" && (
          <p className="mt-4 text-sm text-red-400">
            Name required. Address must be 3–32 letters, numbers, or hyphens.
          </p>
        )}

        <form action={saveTeacherSite} className="mt-8 space-y-4">
          <label className="block text-sm">
            Name learners see
            <input
              name="display_name"
              required
              defaultValue={site?.display_name || ""}
              placeholder="Neuro Func"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Address (slug)
            <input
              name="slug"
              required
              defaultValue={site?.slug || ""}
              placeholder="neurofunc"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </label>
          <p className="text-xs text-slate-500">
            Public page: truknowledge.center/site/your-address
          </p>
          <button
            type="submit"
            className="rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600"
          >
            Save my site
          </button>
        </form>

        {site && (
          <section className="mt-10 space-y-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <div>
              <p className="text-sm text-slate-400">Public page (your courses only)</p>
              <a
                href={publicUrl}
                className="mt-1 block break-all text-[#E8A24A] hover:underline"
              >
                {publicUrl}
              </a>
            </div>
            <div>
              <p className="text-sm text-slate-400">Teacher back office</p>
              <a
                href="/teacher"
                className="mt-1 block text-[#E8A24A] hover:underline"
              >
                {origin}/teacher
              </a>
              <p className="mt-1 text-xs text-slate-500">
                teach.theirsite.com comes next (CNAME). Same desk, their address.
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Embed on their website</p>
              <p className="mt-1 text-xs text-slate-500">
                Their programmer pastes this on one page. Learners never leave
                that page.
              </p>
              <textarea
                readOnly
                value={snippet}
                className="mt-2 h-28 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-xs"
              />
            </div>
            <p className="text-xs text-slate-500">
              Payments: Stripe. Other methods = a custom tweak per client, with
              you, me, and their programmer.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
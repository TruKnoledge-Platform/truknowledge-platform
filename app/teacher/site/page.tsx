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
    .select("slug, display_name, custom_host")
    .eq("teacher_id", user.id)
    .maybeSingle();

  const origin = site?.custom_host
    ? `https://${site.custom_host}`
    : "https://www.truknowledge.center";
  const publicUrl = site ? `${origin}/site/${site.slug}` : "";
  const embedUrl = site ? `${origin}/site/${site.slug}/embed` : "";
  const snippet = site
    ? `<iframe src="${embedUrl}" title="${site.display_name}" style="width:100%;height:100vh;border:0;display:block;"></iframe>`
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
          them.
        </p>

        {q.saved && <p className="mt-4 text-sm text-green-400">Saved.</p>}
        {q.error === "taken" && (
          <p className="mt-4 text-sm text-red-400">
            That address is already used. Try another.
          </p>
        )}
        {q.error === "1" && (
          <p className="mt-4 text-sm text-red-400">
            Name is required. Address must be 3–32 characters: lowercase
            letters, numbers, or hyphens only.
          </p>
        )}
        {q.error === "host" && (
          <p className="mt-4 text-sm text-red-400">
            Course address must be a subdomain, like courses.nowliving.today —
            not the main website, and not truknowledge.center.
          </p>
        )}

        <form action={saveTeacherSite} className="mt-8 space-y-8">
          <label className="block">
            <span className="text-sm font-medium">Name learners see</span>
            <input
              name="display_name"
              required
              defaultValue={site?.display_name || ""}
              placeholder="NOWLiving"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Your site address</span>
            <p className="mt-1 text-xs text-slate-500">
              Example: nowliving-today-course-page
            </p>
            <input
              name="slug"
              required
              defaultValue={site?.slug || ""}
              placeholder="nowliving-today-course-page"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Your course subdomain (optional)
            </span>
            <p className="mt-1 text-sm text-slate-400">
              Leave the main site (nowliving.today) as WordPress. Use a
              subdomain so login and pay stay on your name. Do not type
              https://.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Example: courses.nowliving.today
            </p>
            <input
              name="custom_host"
              defaultValue={site?.custom_host || ""}
              placeholder="courses.nowliving.today"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </label>

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
              <p className="text-sm text-slate-400">Public page</p>
              <a
                href={publicUrl}
                className="mt-1 block break-all text-[#E8A24A] hover:underline"
              >
                {publicUrl}
              </a>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                Paste this on WordPress after the subdomain is live
              </p>
              <textarea
                readOnly
                value={snippet}
                className="mt-2 h-28 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-xs"
              />
            </div>
            {site.custom_host && (
              <div className="text-sm leading-6 text-slate-300">
                <p className="font-medium text-white">To turn this on</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  <li>
                    Vercel → this project → Settings → Domains → Add{" "}
                    <span className="text-[#E8A24A]">{site.custom_host}</span>
                  </li>
                  <li>
                    At the place you bought nowliving.today, add a CNAME:
                    the left part of the subdomain (for{" "}
                    <span className="text-[#E8A24A]">{site.custom_host}</span>{" "}
                    that is the word before the first dot). Target: the value
                    Vercel shows (usually cname.vercel-dns.com).
                  </li>
                  <li>
                    Supabase → Authentication → URL configuration → add{" "}
                    <span className="text-[#E8A24A]">
                      https://{site.custom_host}/**
                    </span>
                  </li>
                  <li>Replace the iframe on WordPress with the snippet above.</li>
                </ol>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
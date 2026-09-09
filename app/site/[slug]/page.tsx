import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import PoweredBy from "../powered-by";

export default async function TeacherPublicSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("teacher_sites")
    .select("teacher_id, display_name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!site) notFound();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url")
    .eq("teacher_id", site.teacher_id)
    .eq("is_published", true)
    .eq("owner_paused", false)
    .eq("show_on_site", true)
    .order("created_at", { ascending: false });

  const next = `/site/${site.slug}`;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">
          {site.display_name}
        </p>
        <h1
          className="mt-3 text-4xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Courses
        </h1>
        <p className="mt-2 text-sm text-slate-400">From this teacher only.</p>

        <div className="mt-4 flex gap-4 text-sm">
          <a
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-[#E8A24A] hover:underline"
          >
            Log in
          </a>
          <a
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="text-[#E8A24A] hover:underline"
          >
            Sign up
          </a>
        </div>

        <div className="mt-8 grid gap-4">
          {!(courses || []).length && (
            <p className="text-slate-400">No published courses yet.</p>
          )}
          {(courses || []).map((course) => (
            <a
              key={course.id}
              href={`/courses/${course.id}`}
              className="flex overflow-hidden rounded-2xl border border-white/10 bg-[#12182A] hover:border-[#E8A24A]"
            >
              <div className="w-[20%] min-w-[96px] shrink-0 bg-[#0B1020]">
                <div className="aspect-video w-full">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#0B1220]" />
                  )}
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-lg">{course.title}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {course.description || ""}
                </p>
              </div>
            </a>
          ))}
        </div>

        <PoweredBy />
      </div>
    </main>
  );
}
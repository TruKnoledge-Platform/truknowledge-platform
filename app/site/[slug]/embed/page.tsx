import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import PoweredBy from "../../powered-by";

export default async function TeacherEmbed({
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
    .order("created_at", { ascending: false });

  const next = `/site/${site.slug}`;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E8A24A]">
          {site.display_name}
        </p>
        <h1
          className="mt-2 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Courses
        </h1>

        <div className="mt-4 flex gap-4 text-sm">
          <a
            href={`/login?next=${encodeURIComponent(next)}`}
            target="_top"
            className="text-[#E8A24A] hover:underline"
          >
            Log in
          </a>
          <a
            href={`/signup?next=${encodeURIComponent(next)}`}
            target="_top"
            className="text-[#E8A24A] hover:underline"
          >
            Sign up
          </a>
        </div>

        <div className="mt-6 grid gap-3">
          {!(courses || []).length && (
            <p className="text-slate-400">No published courses yet.</p>
          )}
          {(courses || []).map((course) => (
            <a
              key={course.id}
              href={`/courses/${course.id}`}
              target="_top"
              className="rounded-2xl border border-white/10 bg-[#12182A] p-4 hover:border-[#E8A24A]"
            >
              <p className="text-lg">{course.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {course.description || ""}
              </p>
            </a>
          ))}
        </div>

        <PoweredBy />
      </div>
    </main>
  );
}
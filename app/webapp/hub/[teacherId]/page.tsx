import { headers } from "next/headers";
import { createClient } from "@/lib/supabase-server";

export default async function TeacherHub({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const supabase = await createClient();
  const host = (await headers()).get("host") || "";
  const onCustom =
    !host.includes("truknowledge.center") && !host.includes("vercel.app");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, webapp_slug, thumbnail_url")
    .eq("teacher_id", teacherId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Courses
        </h1>
        <div className="mt-8 grid gap-4">
          {(courses || []).map((c) => {
            const href =
              onCustom && c.webapp_slug
                ? `/${c.webapp_slug}`
                : `/webapp/${c.id}`;
            return (
              <a
                key={c.id}
                href={href}
                className="rounded-2xl border border-white/10 bg-[#12182A] p-5 hover:border-[#E8A24A]"
              >
                <p className="text-lg">{c.title}</p>
                {c.webapp_slug && (
                  <p className="mt-1 text-sm text-[#9AA3B5]">/{c.webapp_slug}</p>
                )}
              </a>
            );
          })}
          {!(courses || []).length && (
            <p className="text-sm text-[#9AA3B5]">No published courses yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
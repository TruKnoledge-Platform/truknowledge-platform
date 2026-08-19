import { createClient } from "@/lib/supabase-server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, template")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm text-slate-400 hover:text-white">
          Back to home
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Courses</h1>
        <p className="mt-2 text-slate-400">Published courses you can explore.</p>

        <div className="mt-8 grid gap-4">
          {!courses?.length && (
            <p className="text-slate-400">No published courses yet.</p>
          )}
          {courses?.map((course) => (
            <a
              key={course.id}
              href={`/courses/${course.id}`}
              className="rounded-2xl border border-slate-800 bg-[#111827] p-6 hover:border-orange-500"
            >
              <h2 className="text-lg font-medium">{course.title}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {course.description || "No description yet."}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
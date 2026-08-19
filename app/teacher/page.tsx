import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function TeacherPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, template, is_published, created_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-orange-400">Teacher back office</p>
            <h1 className="text-3xl font-semibold">Your courses</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/auth/signout" className="text-sm text-slate-400 hover:text-white">
              Sign out
            </a>
            <a
              href="/teacher/new"
              className="rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600"
            >
              Create a course
            </a>
          </div>
        </div>

        {!courses?.length && (
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="text-lg font-medium">No courses yet</h2>
            <p className="mt-2 text-slate-400">
              Create your first course to get started.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {courses?.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-800 bg-[#111827] p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">{course.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {course.template} · {course.is_published ? "Published" : "Draft"}
                  </p>
                </div>
                <a
                  href={`/teacher/${course.id}`}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
                >
                  Edit
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
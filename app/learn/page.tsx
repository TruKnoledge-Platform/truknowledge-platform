import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, courses(id, title, description, is_published)")
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-orange-400">Learner dashboard</p>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
          </div>
          <div className="flex gap-4 text-sm">
            <a href="/courses" className="text-slate-300 hover:text-white">
              Courses
            </a>
            <a href="/teacher" className="text-orange-400 hover:text-white">
              Teacher area
            </a>
            <a href="/auth/signout" className="text-slate-400 hover:text-white">
              Sign out
            </a>
          </div>
        </div>

        <p className="mb-8 text-slate-400">Signed in as {user.email}</p>

        <h2 className="text-lg font-medium mb-4">My courses</h2>

        {!enrollments?.length && (
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-slate-400">
              You have not enrolled yet.{" "}
              <a href="/courses" className="text-orange-400 hover:underline">
                Browse courses
              </a>
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {enrollments?.map((item: any) => {
            const course = item.courses;
            if (!course) return null;
            return (
              <a
                key={item.id}
                href={`/courses/${course.id}`}
                className="rounded-2xl border border-slate-800 bg-[#111827] p-6 hover:border-orange-500"
              >
                <h3 className="text-lg font-medium">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {course.description || "Continue this course"}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
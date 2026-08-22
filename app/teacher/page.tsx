import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TeacherDashboard from "./dashboard";
import DeleteCourseButton from "./delete-course-button";

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

  const list = courses || [];
  const courseIds = list.map((course) => course.id);

  const { data: enrollments } = courseIds.length
    ? await supabase
        .from("enrollments")
        .select("course_id, country, region")
        .in("course_id", courseIds)
    : { data: [] as { course_id: string; country: string | null; region: string | null }[] };

  const { data: views } = courseIds.length
    ? await supabase.from("course_views").select("course_id").in("course_id", courseIds)
    : { data: [] as { course_id: string }[] };

  const { data: payments } = await supabase
    .from("payments")
    .select("course_id, amount, created_at")
    .eq("teacher_id", user.id);

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  const stats = list.map((course) => ({
    id: course.id,
    title: course.title,
    published: Boolean(course.is_published),
    enrollments: (enrollments || []).filter((row) => row.course_id === course.id)
      .length,
    views: (views || []).filter((row) => row.course_id === course.id).length,
  }));

  const placeMap = new Map<string, { country: string; region: string | null; count: number }>();
  (enrollments || []).forEach((row) => {
    if (!row.country) return;
    const key = `${row.country}::${row.region || ""}`;
    const current = placeMap.get(key);
    if (current) current.count += 1;
    else placeMap.set(key, { country: row.country, region: row.region, count: 1 });
  });

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-orange-400">Teacher home</p>
            <h1 className="text-3xl font-semibold">Your teaching at a glance</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/auth/signout" className="text-sm text-slate-400 hover:text-white">
              Sign out
            </a>
            <a
              href="/teacher/messages"
              className="relative rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
            >
              Messages
              {(unreadCount || 0) > 0 && (
                <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </a>
            <a
              href="/payouts"
              className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
            >
              Payouts
            </a>
            <a
              href="/teacher/new"
              className="rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600"
            >
              Create a course
            </a>
          </div>
        </div>

        <TeacherDashboard
          courses={stats}
          payments={payments || []}
          places={[...placeMap.values()].sort((a, b) => b.count - a.count)}
        />

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-medium">Courses</h2>
          {!list.length && (
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
              <p className="text-slate-400">No courses yet.</p>
              <a
                href="/teacher/new"
                className="mt-4 inline-block text-orange-400 hover:underline"
              >
                Create your first course
              </a>
            </div>
          )}
          <div className="grid gap-4">
            {list.map((course) => {
              const stat = stats.find((item) => item.id === course.id);
              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-800 bg-[#111827] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {course.is_published ? "Published" : "Draft"} ·{" "}
                        {stat?.enrollments || 0} enrolled
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/teacher/${course.id}`}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
                      >
                        Edit
                      </a>
                      <a
                        href={`/webapp/${course.id}`}
                        className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
                      >
                        Web App
                      </a>
                      <DeleteCourseButton courseId={course.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
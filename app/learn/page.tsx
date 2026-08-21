import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function statusLabel(total: number, completed: number, started: boolean) {
  if (total > 0 && completed >= total) return "Completed";
  if (started || completed > 0) return "In progress";
  return "START";
}

function statusClass(label: string) {
  if (label === "Completed") return "bg-red-500/20 text-red-300";
  if (label === "In progress") return "bg-yellow-500/20 text-yellow-300";
  return "bg-emerald-500/20 text-emerald-300";
}

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
    .select("course_id")
    .eq("user_id", user.id);

  const courseIds = (enrollments || []).map((row) => row.course_id);

  const { data: courses } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url")
        .in("id", courseIds)
    : { data: [] as { id: string; title: string; description: string | null; thumbnail_url: string | null }[] };

  const { data: sessions } = courseIds.length
    ? await supabase.from("sessions").select("id, course_id").in("course_id", courseIds)
    : { data: [] as { id: string; course_id: string }[] };

  const sessionIds = (sessions || []).map((row) => row.id);
  const { data: progressRows } = sessionIds.length
    ? await supabase
        .from("progress")
        .select("session_id, completed")
        .eq("user_id", user.id)
        .in("session_id", sessionIds)
    : { data: [] as { session_id: string; completed: boolean }[] };

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/" className="text-sm text-slate-400 hover:text-white">
              Back to home
            </a>
            <h1 className="mt-2 text-3xl font-semibold">My courses</h1>
            <p className="mt-1 text-slate-400">Signed in as {user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/learn/messages"
              className="relative rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
            >
              Messages
              {(unreadCount || 0) > 0 && (
                <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </a>
            <a href="/teacher" className="text-sm text-orange-400 hover:underline">
              Teacher area
            </a>
            <a href="/auth/signout" className="text-sm text-slate-400 hover:text-white">
              Sign out
            </a>
          </div>
        </div>

        {!courses?.length && (
          <p className="text-slate-400">
            No courses yet.{" "}
            <a href="/courses" className="text-orange-400 hover:underline">
              Browse courses
            </a>
          </p>
        )}

        <div className="grid gap-4">
          {courses?.map((course) => {
            const courseSessions = (sessions || []).filter((s) => s.course_id === course.id);
            const courseProgress = (progressRows || []).filter((p) =>
              courseSessions.some((s) => s.id === p.session_id)
            );
            const completed = courseProgress.filter((p) => p.completed).length;
            const started = courseProgress.length > 0;
            const label = statusLabel(courseSessions.length, completed, started);

            return (
              <div
                key={course.id}
                className="flex overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]"
              >
                <div className="w-[20%] min-w-[96px] shrink-0 bg-[#0B1220]">
                  <div className="aspect-video w-full">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <h2 className="text-lg font-medium">{course.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {course.description || "No description yet."}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${statusClass(label)}`}
                    >
                      {label}
                    </span>
                  </div>
                  <a
                    href={`/learn/${course.id}`}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
                  >
                    {label === "START" ? "START" : "Continue"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
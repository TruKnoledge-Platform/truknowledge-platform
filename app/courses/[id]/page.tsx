import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import EnrollButton from "../enroll-button";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, template, is_published, price")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!course) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, order_index")
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/courses" className="text-sm text-slate-400 hover:text-white">
          Back to courses
        </a>

        <p className="mt-6 text-sm text-orange-400">Published course</p>
        <h1 className="mt-2 text-4xl font-semibold">{course.title}</h1>
        <p className="mt-4 text-slate-300">
          {course.description || "No description yet."}
        </p>
        <p className="mt-3 text-lg text-orange-400">
          {Number(course.price) > 0
            ? `$${Number(course.price).toFixed(2)}`
            : "Free"}
        </p>

        <EnrollButton courseId={course.id} price={Number(course.price) || 0} />

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Sessions</h2>
          <div className="mt-4 space-y-3">
            {!sessions?.length && (
              <p className="text-slate-400">No sessions yet.</p>
            )}
            {sessions?.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-slate-800 bg-[#111827] px-4 py-3"
              >
                <span className="text-sm text-orange-400">{session.order_index}</span>
                <span className="ml-3">{session.title}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
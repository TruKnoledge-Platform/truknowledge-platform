import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CoursePlayer from "./player";

export default async function PlayCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (!course) {
    redirect("/learn");
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/learn" className="text-sm text-slate-400 hover:text-white">
          Back to my courses
        </a>
        <div className="mt-6">
          <CoursePlayer
            courseTitle={course.title}
            sessions={sessions || []}
          />
        </div>
      </div>
    </main>
  );
}
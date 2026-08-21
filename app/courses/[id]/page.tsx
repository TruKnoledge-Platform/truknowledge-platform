import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import EnrollButton from "../enroll-button";
import ReviewForm from "../review-form";
import CourseDiscussion from "../course-discussion";

function previewEmbed(url: string) {
  try {
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return "";
  }
  return "";
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, description, template, is_published, price, preview_video_url, discussions_enabled"
    )
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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("course_id", id)
    .order("created_at", { ascending: false });

  const sneakPeek = course.preview_video_url
    ? previewEmbed(course.preview_video_url)
    : "";

  const average =
    reviews && reviews.length
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0;

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
        {reviews && reviews.length > 0 && (
          <p className="mt-1 text-sm text-slate-400">
            {average.toFixed(1)} / 5 · {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>
        )}

        {sneakPeek && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
            <iframe
              src={sneakPeek}
              title="Course sneak peek"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

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

        <CourseDiscussion
          courseId={course.id}
          enabled={Boolean(course.discussions_enabled)}
        />

        <ReviewForm courseId={course.id} />

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <div className="mt-3 space-y-2">
            {!reviews?.length && (
              <p className="text-sm text-slate-400">No reviews yet.</p>
            )}
            {reviews?.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-slate-800 bg-[#111827] px-4 py-3"
              >
                <p className="text-xs text-orange-400">{review.rating} / 5</p>
                <p className="mt-1 text-sm text-slate-300">
                  {review.comment || "No written comment."}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
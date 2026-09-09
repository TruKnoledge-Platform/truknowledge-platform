import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import EnrollButton from "@/app/courses/enroll-button";
import ReviewForm from "@/app/courses/review-form";
import CourseDiscussion from "@/app/courses/course-discussion";
import PoweredBy from "../../../../powered-by";

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

export default async function EmbedCoursePage({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("teacher_sites")
    .select("teacher_id, display_name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!site) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, description, is_published, owner_paused, price, preview_video_url, thumbnail_url, icon_url, discussions_enabled, teacher_id"
    )
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.teacher_id !== site.teacher_id) notFound();
  if (!course.is_published || course.owner_paused) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("course_id", course.id)
    .order("created_at", { ascending: false });

  const sneakPeek = course.preview_video_url
    ? previewEmbed(course.preview_video_url)
    : "";
  const picture = course.thumbnail_url || course.icon_url || "";
  const playNext = `/webapp/${course.id}`;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-5 pb-12 pt-16 md:px-8 md:pt-20">
      <div className="mx-auto max-w-3xl">
        <a
          href={`/site/${site.slug}/embed`}
          className="text-sm text-slate-400 hover:text-white"
        >
          Back to {site.display_name}
        </a>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#E8A24A]">
          {site.display_name}
        </p>
        <h1
          className="mt-3 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {course.title}
        </h1>
        <p className="mt-3 text-slate-300">{course.description || ""}</p>
        <p className="mt-3 text-lg text-[#E8A24A]">
          {Number(course.price) > 0
            ? `$${Number(course.price).toFixed(2)}`
            : "Free"}
        </p>

        {picture && (
          <img
            src={picture}
            alt=""
            className="mt-6 w-full rounded-2xl border border-white/10 object-cover"
          />
        )}

        {sneakPeek && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#12182A]">
            <iframe
              src={sneakPeek}
              title="Course sneak peek"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <EnrollButton
          courseId={course.id}
          price={Number(course.price) || 0}
          next={playNext}
        />

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Sessions</h2>
          <div className="mt-4 space-y-3">
            {!sessions?.length && (
              <p className="text-slate-400">No sessions yet.</p>
            )}
            {sessions?.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-white/10 bg-[#12182A] px-4 py-3"
              >
                <span className="text-sm text-[#E8A24A]">
                  {session.order_index}
                </span>
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
                className="rounded-xl border border-white/10 bg-[#12182A] px-4 py-3"
              >
                <p className="text-xs text-[#E8A24A]">{review.rating} / 5</p>
                <p className="mt-1 text-sm text-slate-300">
                  {review.comment || "No written comment."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <PoweredBy />
      </div>
    </main>
  );
}
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";
import {
  pauseCourse,
  unlistTeacher,
  relistTeacher,
  unlistMember,
  relistMember,
  deleteCourse,
  deleteTeacher,
} from "../../actions";
import TwoStepDelete from "../../two-step-delete";

export default async function OwnerPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireOwner();

  const { data: person } = await supabase
    .from("profiles")
    .select("id, email, role, is_paused")
    .eq("id", id)
    .maybeSingle();

  if (!person) notFound();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, is_published, owner_paused")
    .eq("teacher_id", id)
    .order("created_at", { ascending: false });

  const name = person.email || person.id;
  const isYou = person.id === user.id;
  const isTeacher = (courses || []).length > 0;
  const allUnlisted = isTeacher
    ? (courses || []).every((course) => course.owner_paused)
    : !!person.is_paused;

  const unlistAction = isTeacher
    ? allUnlisted
      ? relistTeacher
      : unlistTeacher
    : allUnlisted
      ? relistMember
      : unlistMember;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/owner/people" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to people
        </a>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {name}
            </h1>
            <p className="mt-1 text-sm text-[#9AA3B5]">
              {isTeacher ? "teacher" : "member"}
              {person.is_paused ? " · unlisted" : ""}
              {isYou ? " · this is you — delete is hidden" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={unlistAction}>
              <input type="hidden" name="teacherId" value={id} />
              <button
                type="submit"
                className="rounded-full border border-[#E8A24A]/50 px-4 py-1.5 text-sm text-[#E8A24A]"
              >
                {allUnlisted ? "Re-enlist" : "Unlist"}
              </button>
            </form>
            {!isYou && (
              <TwoStepDelete
                action={deleteTeacher}
                hidden={{ teacherId: id }}
                first={`Are you sure you want to delete ${name}?`}
                second="This will PERMANENTLY DELETE this account."
                label="Delete"
              />
            )}
          </div>
        </div>

        {isTeacher && (
          <>
            <h2
              className="mt-10 text-xl text-[#E8A24A]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Courses
            </h2>
            <div className="mt-4 space-y-3">
              {(courses || []).map((course) => (
                <div
                  key={course.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12182A] px-4 py-3"
                >
                  <div>
                    <p>{course.title}</p>
                    <p className="text-xs text-[#9AA3B5]">
                      {course.owner_paused
                        ? "paused / invisible"
                        : course.is_published
                          ? "published"
                          : "draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={pauseCourse}>
                      <input type="hidden" name="id" value={course.id} />
                      <input type="hidden" name="teacherId" value={id} />
                      <input
                        type="hidden"
                        name="paused"
                        value={course.owner_paused ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-[#E8A24A]/50 px-4 py-1.5 text-sm text-[#E8A24A]"
                      >
                        {course.owner_paused ? "Unpause course" : "Pause"}
                      </button>
                    </form>
                    <TwoStepDelete
                      action={deleteCourse}
                      hidden={{ id: course.id, teacherId: id }}
                      first={`Are you sure you want to delete "${course.title}"?`}
                      second="This will PERMANENTLY DELETE COURSE"
                      label="Delete"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
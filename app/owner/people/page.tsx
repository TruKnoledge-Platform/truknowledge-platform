import { requireOwner } from "@/lib/is-owner";

export default async function OwnerPeople({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireOwner();
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [{ data: taught }, { data: connected }, { data: profiles }] =
    await Promise.all([
      supabase.from("courses").select("teacher_id"),
      supabase.from("teacher_profiles").select("user_id"),
      supabase.from("profiles").select("id, email, role"),
    ]);

  const teacherIds = new Set<string>([
    ...(taught || []).map((row) => row.teacher_id).filter(Boolean),
    ...(connected || []).map((row) => row.user_id).filter(Boolean),
  ]);

  const teachers = (profiles || [])
    .filter((p) => teacherIds.has(p.id))
    .filter((p) =>
      query ? (p.email || p.id).toLowerCase().includes(query) : true
    );

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/owner" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to owner home
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Teachers
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">
          Search, then open a teacher to pause or delete their courses or
          account.
        </p>

        <form className="mt-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email"
            className="w-full rounded-xl bg-[#12182A] px-4 py-3 text-[#F3E6D2]"
          />
        </form>

        <div className="mt-6 space-y-3">
          {teachers.map((person) => (
            <a
              key={person.id}
              href={`/owner/people/${person.id}`}
              className="block rounded-xl border border-white/10 bg-[#12182A] px-4 py-3 hover:border-[#E8A24A]"
            >
              <p>{person.email || person.id}</p>
              <p className="text-xs text-[#9AA3B5]">{person.role || "teacher"}</p>
            </a>
          ))}
          {!teachers.length && (
            <p className="text-sm text-[#9AA3B5]">No teachers match.</p>
          )}
        </div>
      </div>
    </main>
  );
}
import { requireOwner } from "@/lib/is-owner";

export default async function OwnerDomains() {
  const { supabase } = await requireOwner();
  const { data: orders } = await supabase
    .from("domain_orders")
    .select(
      "id, teacher_id, course_id, kind, host, name1, name2, name3, amount, created_at"
    )
    .order("created_at", { ascending: false });

  const teacherIds = [...new Set((orders || []).map((o) => o.teacher_id))];
  const courseIds = [
    ...new Set((orders || []).map((o) => o.course_id).filter(Boolean)),
  ] as string[];

  const { data: people } = teacherIds.length
    ? await supabase.from("profiles").select("id, email").in("id", teacherIds)
    : { data: [] };
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title").in("id", courseIds)
    : { data: [] };

  const emailOf = (id: string) => people?.find((p) => p.id === id)?.email || id;
  const titleOf = (id: string | null) =>
    courses?.find((c) => c.id === id)?.title || "—";

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <a href="/owner" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to owner home
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Domain orders
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">
          Paid Choice 2 and Choice 3 requests. Reply within 48 hours.
        </p>

        <div className="mt-8 space-y-4">
          {(orders || []).map((o) => (
            <section
              key={o.id}
              className="rounded-2xl border border-white/10 bg-[#12182A] p-5"
            >
              <p className="text-[#E8A24A]">
                {o.kind} · ${Number(o.amount).toFixed(2)}
              </p>
              <p className="mt-1 text-sm">{emailOf(o.teacher_id)}</p>
              <p className="text-sm text-[#9AA3B5]">{titleOf(o.course_id)}</p>
              {o.host && <p className="mt-2 text-sm">CNAME: {o.host}</p>}
              {(o.name1 || o.name2 || o.name3) && (
                <p className="mt-2 text-sm">
                  Names: {[o.name1, o.name2, o.name3].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="mt-2 text-xs text-[#9AA3B5]">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </section>
          ))}
          {!(orders || []).length && (
            <p className="text-sm text-[#9AA3B5]">No domain orders yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
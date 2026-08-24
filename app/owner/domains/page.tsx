import { requireOwner } from "@/lib/is-owner";
import { markCnameLive } from "./actions";

const KIND_WORDS: Record<string, string> = {
  cname_diy: "Choice 2 — they add the CNAME",
  cname_setup: "Choice 2 — we add the CNAME",
  domain_first: "Choice 3 — first course, we buy",
  domain_extra: "Choice 3 — extra course",
};

function cnameBits(host: string) {
  const clean = host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const parts = clean.split(".");
  if (parts.length < 2) {
    return { name: "app", rest: clean, full: clean };
  }
  return { name: parts[0], rest: parts.slice(1).join("."), full: clean };
}

export default async function OwnerDomains() {
  const { supabase } = await requireOwner();
  const { data: orders } = await supabase
    .from("domain_orders")
    .select(
      "id, teacher_id, course_id, kind, host, name1, name2, name3, amount, status, created_at"
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
    ? await supabase.from("courses").select("id, title, custom_host").in("id", courseIds)
    : { data: [] };

  const emailOf = (id: string) => people?.find((p) => p.id === id)?.email || id;
  const courseOf = (id: string | null) => courses?.find((c) => c.id === id);

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
          Choice 2: add the name in Vercel, then Mark live. Reply within 48 hours.
        </p>

        <div className="mt-8 space-y-4">
          {(orders || []).map((o) => {
            const bits = o.host ? cnameBits(o.host) : null;
            const live = o.status === "live" || !!courseOf(o.course_id)?.custom_host;
            const isCname = o.kind === "cname_diy" || o.kind === "cname_setup";
            return (
              <section
                key={o.id}
                className="rounded-2xl border border-white/10 bg-[#12182A] p-5"
              >
                <p className="text-[#E8A24A]">
                  {KIND_WORDS[o.kind] || o.kind} · ${Number(o.amount).toFixed(2)}
                </p>
                <p className="mt-1 text-sm">{emailOf(o.teacher_id)}</p>
                <p className="text-sm text-[#9AA3B5]">
                  {courseOf(o.course_id)?.title || "—"}
                </p>
                {o.host && <p className="mt-2 text-sm">Address: {o.host}</p>}
                {(o.name1 || o.name2 || o.name3) && (
                  <p className="mt-2 text-sm">
                    Names: {[o.name1, o.name2, o.name3].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#9AA3B5]">
                  {live ? "LIVE" : "Paid — not live yet"} ·{" "}
                  {new Date(o.created_at).toLocaleString()}
                </p>

                {isCname && bits && !live && (
                  <div className="mt-4 rounded-xl bg-[#0B1020] p-4 text-sm leading-6">
                    <p>In Vercel → Domains, add:</p>
                    <p className="text-[#E8A24A]">{bits.full}</p>
                    {o.kind === "cname_setup" && (
                      <p className="mt-2">
                        You add the DNS too. At their registrar:
                        <br />
                        Type <span className="text-[#E8A24A]">CNAME</span>
                        <br />
                        Name <span className="text-[#E8A24A]">{bits.name}</span>
                        <br />
                        Value{" "}
                        <span className="text-[#E8A24A]">cname.vercel-dns.com</span>
                      </p>
                    )}
                    <form action={markCnameLive} className="mt-4">
                      <input type="hidden" name="orderId" value={o.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
                      >
                        Mark live
                      </button>
                    </form>
                  </div>
                )}
              </section>
            );
          })}
          {!(orders || []).length && (
            <p className="text-sm text-[#9AA3B5]">No domain orders yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
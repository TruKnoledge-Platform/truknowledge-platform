import { requireOwner } from "@/lib/is-owner";
import { markCnameLive, markBoughtLive, suggestNames } from "./actions";

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
      "id, teacher_id, course_id, kind, host, name1, name2, name3, suggested1, suggested2, suggested3, chosen_domain, amount, status, created_at"
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
    ? await supabase
        .from("courses")
        .select("id, title, custom_host, webapp_slug")
        .in("id", courseIds)
    : { data: [] };
  const { data: teachers } = teacherIds.length
    ? await supabase
        .from("teacher_profiles")
        .select("user_id, bought_domain")
        .in("user_id", teacherIds)
    : { data: [] };

  const emailOf = (id: string) => people?.find((p) => p.id === id)?.email || id;
  const courseOf = (id: string | null) => courses?.find((c) => c.id === id);
  const boughtOf = (id: string) =>
    teachers?.find((t) => t.user_id === id)?.bought_domain;

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
          Choice 2: add in Vercel, wait Valid, Mark live. Choice 3: buy a name
          or send 3 others.
        </p>

        <div className="mt-8 space-y-4">
          {(orders || []).map((o) => {
            const bits = o.host ? cnameBits(o.host) : null;
            const live =
              o.status === "live" ||
              !!courseOf(o.course_id)?.custom_host ||
              (o.kind?.startsWith("domain") && !!boughtOf(o.teacher_id));
            const isCname = o.kind === "cname_diy" || o.kind === "cname_setup";
            const isBuy = o.kind === "domain_first" || o.kind === "domain_extra";
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
                {o.host && <p className="mt-2 text-sm">CNAME: {o.host}</p>}
                {(o.name1 || o.name2 || o.name3) && (
                  <p className="mt-2 text-sm">
                    Their 3 names:{" "}
                    {[o.name1, o.name2, o.name3].filter(Boolean).join(" · ")}
                  </p>
                )}
                {o.chosen_domain && (
                  <p className="mt-2 text-sm">They picked: {o.chosen_domain}</p>
                )}
                {boughtOf(o.teacher_id) && (
                  <p className="mt-2 text-sm text-[#E8A24A]">
                    Live domain: {boughtOf(o.teacher_id)}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#9AA3B5]">
                  {o.status === "waiting_choice"
                    ? "Waiting for teacher to pick a name"
                    : live
                      ? "LIVE"
                      : "Paid — not live yet"}{" "}
                  · {new Date(o.created_at).toLocaleString()}
                </p>

                {isCname && bits && !live && (
                  <div className="mt-4 rounded-xl bg-[#0B1020] p-4 text-sm leading-6">
                    <p className="font-medium text-[#E8A24A]">Your steps</p>
                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                      <li>
                        Vercel → this project → Settings → Domains → Add{" "}
                        <span className="text-[#E8A24A]">{bits.full}</span>
                      </li>
                      <li>
                        DNS (Name / Host{" "}
                        <span className="text-[#E8A24A]">{bits.name}</span>,
                        Type CNAME, Value{" "}
                        <span className="text-[#E8A24A]">cname.vercel-dns.com</span>
                        ).{" "}
                        {o.kind === "cname_diy"
                          ? "They add this. You only check it."
                          : "You add this at their domain company."}
                      </li>
                      <li>Wait until Vercel says Valid on that name.</li>
                      <li>Mark live.</li>
                    </ol>
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

                {isBuy && !live && (
                  <div className="mt-4 space-y-6 rounded-xl bg-[#0B1020] p-4 text-sm">
                    <form action={markBoughtLive} className="space-y-3">
                      <input type="hidden" name="orderId" value={o.id} />
                      <label className="block">
                        Domain you bought (or they picked)
                        <input
                          name="domain"
                          required
                          defaultValue={o.chosen_domain || o.name1 || ""}
                          placeholder="neurofunc.com"
                          className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2"
                        />
                      </label>
                      <p className="text-xs text-[#9AA3B5]">
                        Add this domain in Vercel first, wait until Valid, then
                        mark live.
                      </p>
                      <button
                        type="submit"
                        className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
                      >
                        We bought this — mark live
                      </button>
                    </form>

                    {o.kind === "domain_first" && (
                      <form
                        action={suggestNames}
                        className="space-y-3 border-t border-white/10 pt-4"
                      >
                        <input type="hidden" name="orderId" value={o.id} />
                        <p>None of their 3 are free? Send 3 others:</p>
                        <input
                          name="suggested1"
                          required
                          placeholder="First suggestion"
                          className="block w-full rounded-lg bg-[#12182A] px-3 py-2"
                        />
                        <input
                          name="suggested2"
                          required
                          placeholder="Second suggestion"
                          className="block w-full rounded-lg bg-[#12182A] px-3 py-2"
                        />
                        <input
                          name="suggested3"
                          required
                          placeholder="Third suggestion"
                          className="block w-full rounded-lg bg-[#12182A] px-3 py-2"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A]"
                        >
                          Send these 3 to the teacher
                        </button>
                      </form>
                    )}
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
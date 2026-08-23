import { requireOwner } from "@/lib/is-owner";
import { setPaused } from "../actions";

export default async function OwnerPeople() {
  const { supabase } = await requireOwner();
  const { data: people } = await supabase
    .from("profiles")
    .select("id, email, role, is_paused")
    .order("email", { ascending: true });

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
          People
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">
          Pause an account when you need to. Delete comes later — pause is safer.
        </p>

        <div className="mt-8 space-y-3">
          {(people || []).map((person) => (
            <div
              key={person.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12182A] px-4 py-3"
            >
              <div>
                <p>{person.email || person.id}</p>
                <p className="text-xs text-[#9AA3B5]">
                  {person.role || "member"}
                  {person.is_paused ? " · paused" : ""}
                </p>
              </div>
              <form action={setPaused}>
                <input type="hidden" name="id" value={person.id} />
                <input
                  type="hidden"
                  name="paused"
                  value={person.is_paused ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="rounded-full border border-[#E8A24A]/50 px-4 py-1.5 text-sm text-[#E8A24A]"
                >
                  {person.is_paused ? "Unpause" : "Pause"}
                </button>
              </form>
            </div>
          ))}
          {!people?.length && (
            <p className="text-sm text-[#9AA3B5]">No profiles yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
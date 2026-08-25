import { requireOwner } from "@/lib/is-owner";
import { replyToContact } from "./actions";

export default async function OwnerContact({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; err?: string }>;
}) {
  const { sent, err } = await searchParams;
  const { supabase } = await requireOwner();
  const { data: notes } = await supabase
    .from("site_contacts")
    .select("id, name, email, body, created_at")
    .order("created_at", { ascending: false });

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
          Contact us
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">
          Messages from the public Contact us page.
        </p>

        {sent && (
          <p className="mt-4 text-sm text-[#E8A24A]">Reply sent.</p>
        )}
        {err && (
          <p className="mt-4 text-sm text-red-300">
            {decodeURIComponent(err)}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {(notes || []).map((n) => (
            <section
              key={n.id}
              className="rounded-2xl border border-white/10 bg-[#12182A] p-5"
            >
              <p className="text-[#E8A24A]">{n.name || "No name"}</p>
              <p className="text-sm">{n.email}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{n.body}</p>
              <p className="mt-3 text-xs text-[#9AA3B5]">
                {new Date(n.created_at).toLocaleString()}
              </p>
              <form action={replyToContact} className="mt-4 space-y-3">
                <input type="hidden" name="email" value={n.email} />
                <textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Write your reply"
                  className="w-full rounded-lg bg-[#0B1020] px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
                >
                  Send reply
                </button>
              </form>
            </section>
          ))}
          {!(notes || []).length && (
            <p className="text-sm text-[#9AA3B5]">No messages yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
<a href="/auth/signout" className="text-sm text-slate-400 hover:text-white">
  Sign out
</a>
export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-orange-400 mb-2">Learner dashboard</p>
        <h1 className="text-3xl font-semibold mb-3">Welcome back</h1>
        <p className="text-slate-400 mb-8">
          Signed in as {user.email}
        </p>

        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <h2 className="text-lg font-medium mb-2">Continue learning</h2>
          <p className="text-slate-400">
            Your courses will appear here once you enroll.
          </p>
        </div>
      </div>
    </main>
  );
}
<a href="/auth/signout" className="text-sm text-slate-400 hover:text-white">
  Sign out
</a>

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function TeachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-orange-400 mb-2">Teacher back office</p>
        <h1 className="text-3xl font-semibold mb-3">Your courses</h1>
        <p className="text-slate-400 mb-8">
          Signed in as {user.email}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/teach"
            className="rounded-2xl border border-slate-800 bg-[#111827] p-6 hover:border-orange-500"
          >
            <h2 className="text-lg font-medium mb-2">Create a course</h2>
            <p className="text-slate-400">
              Build a course and launch it as a Web App from one place.
            </p>
          </a>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="text-lg font-medium mb-2">Payouts</h2>
            <p className="text-slate-400">
              Stripe payouts will appear here later.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
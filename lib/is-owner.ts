import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

export async function requireOwner(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/owner");
  }

  const owner = user as User;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", owner.id)
    .maybeSingle();

  const envOwner = process.env.OWNER_EMAIL;
  const ok =
    profile?.role === "owner" ||
    (!!envOwner && owner.email === envOwner);

  if (!ok) {
    redirect("/");
  }

  return { supabase, user: owner };
}
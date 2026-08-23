import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/owner");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const envOwner = process.env.OWNER_EMAIL;
  const ok =
    profile?.role === "owner" ||
    (!!envOwner && user.email === envOwner);

  if (!ok) {
    redirect("/");
  }

  return { supabase, user };
}
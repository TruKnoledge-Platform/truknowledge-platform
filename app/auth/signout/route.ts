import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") ? next : "/login";

  return NextResponse.redirect(new URL(dest, url.origin));
}
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://truknowledge.center"
  ).replace(/\/$/, "");
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.redirect(new URL("/payouts", origin));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/payouts", origin));
  }

  const admin = createAdmin();
  const { data: teacher } = await admin
    .from("teacher_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!teacher?.stripe_account_id) {
    return NextResponse.redirect(new URL("/payouts", origin));
  }

  const stripe = new Stripe(key);
  const link = await stripe.accounts.createLoginLink(teacher.stripe_account_id);
  return NextResponse.redirect(link.url);
}

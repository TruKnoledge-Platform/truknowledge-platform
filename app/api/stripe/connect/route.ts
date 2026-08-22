import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

export async function GET() {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://truknowledge.center"
  ).replace(/\/$/, "");

  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/payouts", origin));
  }

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let accountId = teacher?.stripe_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email || undefined,
      metadata: { userId: user.id },
    });
    accountId = account.id;

    await supabase.from("teacher_profiles").upsert({
      user_id: user.id,
      stripe_account_id: accountId,
    });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/payouts`,
    return_url: `${origin}/payouts`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function GET(req: NextRequest) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  let accountId = profile?.stripe_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email || undefined,
      metadata: { userId: user.id },
    });
    accountId = account.id;
    await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/payouts`,
    return_url: `${origin}/payouts`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}
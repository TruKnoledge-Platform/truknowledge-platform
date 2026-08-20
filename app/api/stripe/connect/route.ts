import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const STRIPE_VERSION = "2026-07-29.preview";

async function stripeV2(path: string, method: string, body?: object) {
  const res = await fetch(`https://api.stripe.com/v2/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      JSON.stringify(data);
    throw new Error(message);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const body = await req.json().catch(() => ({}));
    const action = body.action || "onboard";

    const { data: profile } = await supabase
      .from("teacher_profiles")
      .select("stripe_account_id, payout_speed")
      .eq("user_id", user.id)
      .maybeSingle();

    let accountId = profile?.stripe_account_id as string | undefined;

    if (!accountId) {
      const account = await stripeV2("core/accounts", "POST", {
        contact_email: user.email,
        display_name: user.email || "TruKnowledge teacher",
        dashboard: "express",
        identity: {
          country: "us",
          entity_type: "individual",
        },
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        defaults: {
          currency: "usd",
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        include: ["configuration.merchant", "configuration.recipient", "requirements"],
      });

      accountId = account.id;
      await supabase.from("teacher_profiles").upsert({
        user_id: user.id,
        stripe_account_id: accountId,
        payout_speed: "monthly",
        charges_enabled: false,
        updated_at: new Date().toISOString(),
      });
    }

    if (action === "status") {
      const account = await stripeV2(
        `core/accounts/${accountId}?include=configuration.merchant,configuration.recipient`,
        "GET"
      );
      const transfers =
        account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers
          ?.status === "active";
      const cards =
        account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";
      const ready = Boolean(transfers || cards);
      await supabase
        .from("teacher_profiles")
        .update({
          charges_enabled: ready,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      return NextResponse.json({
        ok: true,
        charges_enabled: ready,
        stripe_account_id: accountId,
      });
    }

    if (action === "payout_speed") {
      const speed = body.payout_speed === "immediate" ? "immediate" : "monthly";
      await stripe.accounts.update(accountId!, {
        settings: {
          payouts: {
            schedule:
              speed === "immediate"
                ? { interval: "daily" }
                : { interval: "monthly", monthly_anchor: 1 },
          },
        },
      });
      await supabase
        .from("teacher_profiles")
        .update({ payout_speed: speed, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true, payout_speed: speed });
    }

    const link = await stripeV2("core/account_links", "POST", {
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: `${origin}/payouts?refresh=1`,
          return_url: `${origin}/payouts?return=1`,
        },
      },
    });

    const url = link.url || link?.use_case?.account_onboarding?.url;
    if (!url) {
      return NextResponse.json(
        { error: "Stripe did not return an onboarding URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
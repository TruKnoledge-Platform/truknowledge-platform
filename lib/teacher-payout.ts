import Stripe from "stripe";
import { createAdmin } from "@/lib/supabase-admin";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

async function feeRate() {
  const supabase = createAdmin();
  const { data } = await supabase
    .from("platform_settings")
    .select("fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const percent = Number(data?.fee_percent ?? 15);
  return {
    percent: Math.min(100, Math.max(0, percent)),
    rate: Math.min(100, Math.max(0, percent)) / 100,
  };
}

export async function sendUnpaidSales(teacherId: string, accountId: string) {
  const supabase = createAdmin();
  const { rate } = await feeRate();
  const { data: rows } = await supabase
    .from("payments")
    .select("id, amount")
    .eq("teacher_id", teacherId)
    .eq("transferred", false);

  const list = rows || [];
  let sentCount = 0;
  let sentAmount = 0;
  let note = "";

  for (const row of list) {
    const cents = Math.round(Number(row.amount) * 100 * (1 - rate));
    if (cents < 1) {
      await supabase.from("payments").update({ transferred: true }).eq("id", row.id);
      sentCount += 1;
      continue;
    }
    try {
      const transfer = await stripeClient().transfers.create(
        {
          amount: cents,
          currency: "usd",
          destination: accountId,
          metadata: { paymentId: row.id, teacherId },
        },
        { idempotencyKey: `sale-${row.id}` }
      );
      await supabase
        .from("payments")
        .update({ transferred: true, transfer_id: transfer.id })
        .eq("id", row.id);
      sentCount += 1;
      sentAmount += cents / 100;
    } catch (err) {
      note = err instanceof Error ? err.message : "Transfer failed";
      break;
    }
  }

  return { sentCount, sentAmount, waiting: list.length - sentCount, note };
}

export async function syncStripeAccount(account: Stripe.Account) {
  const supabase = createAdmin();
  const charges = Boolean(account.charges_enabled);
  const payouts = Boolean(account.payouts_enabled);
  await supabase
    .from("teacher_profiles")
    .update({ charges_enabled: charges, payouts_enabled: payouts })
    .eq("stripe_account_id", account.id);

  if (!charges) {
    return { sentCount: 0, sentAmount: 0, waiting: 0, note: "" };
  }

  const { data: row } = await supabase
    .from("teacher_profiles")
    .select("user_id")
    .eq("stripe_account_id", account.id)
    .maybeSingle();

  if (!row?.user_id) {
    return { sentCount: 0, sentAmount: 0, waiting: 0, note: "" };
  }

  return sendUnpaidSales(row.user_id, account.id);
}

export async function refreshTeacher(userId: string) {
  const supabase = createAdmin();
  const { percent } = await feeRate();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id, payout_schedule")
    .eq("user_id", userId)
    .maybeSingle();

  const schedule = teacher?.payout_schedule === "daily" ? "daily" : "monthly";

  if (!teacher?.stripe_account_id) {
    return {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      schedule,
      feePercent: percent,
      sentCount: 0,
      sentAmount: 0,
      waiting: 0,
      note: "",
    };
  }

  const account = await stripeClient().accounts.retrieve(teacher.stripe_account_id);
  const sent = await syncStripeAccount(account);
  return {
    connected: true,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    schedule,
    feePercent: percent,
    ...sent,
  };
}

export async function destinationForTeacher(teacherId: string) {
  const supabase = createAdmin();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id")
    .eq("user_id", teacherId)
    .maybeSingle();
  if (!teacher?.stripe_account_id) return null;

  try {
    const account = await stripeClient().accounts.retrieve(teacher.stripe_account_id);
    await supabase
      .from("teacher_profiles")
      .update({
        charges_enabled: Boolean(account.charges_enabled),
        payouts_enabled: Boolean(account.payouts_enabled),
      })
      .eq("user_id", teacherId);
    return account.charges_enabled ? account.id : null;
  } catch {
    return null;
  }
}

export async function setPayoutSchedule(userId: string, schedule: "daily" | "monthly") {
  const supabase = createAdmin();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!teacher?.stripe_account_id) {
    throw new Error("Connect Stripe first.");
  }

  await stripeClient().accounts.update(teacher.stripe_account_id, {
    settings: {
      payouts: {
        schedule:
          schedule === "daily"
            ? { interval: "daily" }
            : { interval: "monthly", monthly_anchor: 1 },
      },
    },
  });

  await supabase
    .from("teacher_profiles")
    .update({ payout_schedule: schedule })
    .eq("user_id", userId);
}

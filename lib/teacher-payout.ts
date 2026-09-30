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
  const { dollars: instantDollars } = await instantFee();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id, payout_schedule")
    .eq("user_id", userId)
    .maybeSingle();

  const raw = teacher?.payout_schedule;
  const schedule = raw === "daily" || raw === "instant" ? raw : "monthly";

  if (!teacher?.stripe_account_id) {
    return {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      schedule,
      feePercent: percent,
      instantFee: instantDollars,
      instantPaid: 0,
      instantServiceFee: 0,
      sentCount: 0,
      sentAmount: 0,
      waiting: 0,
      note: "",
    };
  }

  const account = await stripeClient().accounts.retrieve(teacher.stripe_account_id);
  const sent = await syncStripeAccount(account);
  let instantPaid = 0;
  let instantServiceFee = 0;
  let note = sent.note;
  if (schedule === "instant" && account.charges_enabled) {
    try {
      const instant = await sendImmediatePayout(userId, true);
      instantPaid = instant.paid;
      instantServiceFee = instant.fee;
      if (instant.note) note = [note, instant.note].filter(Boolean).join(" ");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Immediate payout failed";
      note = [note, message].filter(Boolean).join(" ");
    }
  }
  return {
    connected: true,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    schedule,
    feePercent: percent,
    instantFee: instantDollars,
    instantPaid,
    instantServiceFee,
    sentCount: sent.sentCount,
    sentAmount: sent.sentAmount,
    waiting: sent.waiting,
    note,
  };
}

async function instantFee() {
  const supabase = createAdmin();
  const { data } = await supabase
    .from("platform_settings")
    .select("instant_payout_fee")
    .eq("id", 1)
    .maybeSingle();
  const dollars = Number(data?.instant_payout_fee ?? 0);
  const safe = Number.isFinite(dollars) && dollars > 0 ? dollars : 0;
  return {
    dollars: Math.round(safe * 100) / 100,
    cents: Math.round(safe * 100),
  };
}

function plainInstantError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("instant") ||
    lower.includes("debit") ||
    lower.includes("external account") ||
    lower.includes("payout method")
  ) {
    return "Stripe cannot send money in minutes until a debit card is on the account. Open Stripe and add a debit card, then choose Immediate again.";
  }
  if (lower.includes("insufficient") || lower.includes("balance")) {
    return "The money is not available to send yet. Card payments take about two days to clear.";
  }
  return message;
}

async function platformAccountId() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  const res = await fetch("https://api.stripe.com/v1/account", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();
  if (!data?.id) {
    throw new Error(data?.error?.message || "Could not read the platform Stripe account");
  }
  return data.id as string;
}

export async function sendImmediatePayout(userId: string, quiet = false) {
  const supabase = createAdmin();
  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!teacher?.stripe_account_id) {
    throw new Error("Connect Stripe first.");
  }

  const { dollars, cents: feeCents } = await instantFee();
  const accountId = teacher.stripe_account_id as string;
  const balance = await stripeClient().balance.retrieve(
    {},
    { stripeAccount: accountId }
  );
  const available =
    balance.available.find((row) => row.currency === "usd")?.amount || 0;

  if (available < feeCents + 50) {
    if (quiet) return { paid: 0, fee: 0, note: "" };
    if (available < 50) {
      return {
        paid: 0,
        fee: 0,
        note: "Nothing is available to send yet. Card payments take about two days to clear.",
      };
    }
    return {
      paid: 0,
      fee: 0,
      note: `The available balance is too small. Immediate sending costs $${dollars.toFixed(2)}, and at least $0.50 must remain to send.`,
    };
  }

  const payoutAmount = available - feeCents;
  let payout;
  try {
    payout = await stripeClient().payouts.create(
      { amount: payoutAmount, currency: "usd", method: "instant" },
      { stripeAccount: accountId }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Immediate payout failed";
    throw new Error(plainInstantError(message));
  }

  let feeTaken = 0;
  let note = "";
  if (feeCents > 0) {
    try {
      const platformId = await platformAccountId();
      await stripeClient().transfers.create(
        { amount: feeCents, currency: "usd", destination: platformId },
        { stripeAccount: accountId, idempotencyKey: `instant-fee-${payout.id}` }
      );
      feeTaken = dollars;
    } catch {
      note = "The money was sent, but the service fee could not be moved yet.";
    }
  }

  await supabase.from("instant_payouts").insert({
    teacher_id: userId,
    payout_amount: payoutAmount / 100,
    fee_amount: feeTaken,
    stripe_payout_id: payout.id,
  });

  return { paid: payoutAmount / 100, fee: feeTaken, note };
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

export async function setPayoutSchedule(
  userId: string,
  schedule: "daily" | "monthly" | "instant"
) {
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
            : schedule === "instant"
              ? { interval: "manual" }
              : { interval: "monthly", monthly_anchor: 1 },
      },
    },
  });

  await supabase
    .from("teacher_profiles")
    .update({ payout_schedule: schedule })
    .eq("user_id", userId);
}

export async function instantIfChosen(accountId: string) {
  const supabase = createAdmin();
  const { data } = await supabase
    .from("teacher_profiles")
    .select("user_id, payout_schedule")
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  if (data?.payout_schedule !== "instant" || !data.user_id) return;
  try {
    await sendImmediatePayout(data.user_id, true);
  } catch {
    return;
  }
}

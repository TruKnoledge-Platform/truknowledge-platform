import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY. Restart the app after saving .env.local." },
        { status: 500 }
      );
    }

    const { courseId, next } = await req.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, title, price, is_published, teacher_id")
      .eq("id", courseId)
      .single();

    if (!course || !course.is_published) {
      return NextResponse.json({ error: "Course not available" }, { status: 400 });
    }

    const price = Number(course.price) || 0;
    if (price <= 0) {
      return NextResponse.json({ error: "This course is free" }, { status: 400 });
    }

    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", course.teacher_id)
      .maybeSingle();

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("fee_percent")
      .eq("id", 1)
      .maybeSingle();
    const feePercent = Number(settings?.fee_percent ?? 15) / 100;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.get("origin") || "https://truknowledge.center";
    const amount = Math.round(price * 100);
    const applicationFee = Math.round(amount * feePercent);
    const safeNext =
      typeof next === "string" && next.startsWith("/") ? next : "/learn";

    const destination =
      teacherProfile?.charges_enabled && teacherProfile.stripe_account_id
        ? teacherProfile.stripe_account_id
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: course.title },
          },
        },
      ],
      metadata: {
        courseId: course.id,
        userId: user.id,
        next: safeNext,
      },
      payment_intent_data: destination
        ? {
            application_fee_amount: applicationFee,
            transfer_data: { destination },
          }
        : undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent(safeNext)}`,
      cancel_url: `${origin}${safeNext}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
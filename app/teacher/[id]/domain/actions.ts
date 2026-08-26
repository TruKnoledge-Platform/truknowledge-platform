"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const RESERVED = new Set([
  "www",
  "mail",
  "email",
  "ftp",
  "api",
  "app",
  "admin",
  "owner",
  "teacher",
  "learn",
  "login",
  "signup",
  "auth",
  "checkout",
  "webapp",
  "contact",
  "unlisted",
  "payouts",
  "courses",
  "cdn",
]);

function cleanSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function cleanHost(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .split(":")[0];
}

function hostOk(host: string) {
  if (!host) return false;
  if (host.endsWith("truknowledge.center")) return false;
  if (host.endsWith("vercel.app")) return false;
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 3) return false;
  if (parts[0] === "www") return false;
  return true;
}

export async function saveWebAppSlug(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") || "");
  const slug = cleanSlug(String(formData.get("slug") || ""));
  if (!courseId) redirect("/teacher");
  if (!slug) redirect(`/teacher/${courseId}/domain?err=name`);
  if (RESERVED.has(slug)) redirect(`/teacher/${courseId}/domain?err=reserved`);

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!course) redirect("/teacher");

  const { data: taken } = await supabase
    .from("courses")
    .select("id")
    .eq("webapp_slug", slug)
    .neq("id", courseId)
    .maybeSingle();
  if (taken) redirect(`/teacher/${courseId}/domain?err=taken`);

  await supabase.from("courses").update({ webapp_slug: slug }).eq("id", courseId);
  redirect(`/teacher/${courseId}/domain?ok=1`);
}

const KIND_LABEL: Record<string, string> = {
  cname_diy: "Choice 2 — I add the CNAME",
  cname_setup: "Choice 2 — TruKnowledge adds the CNAME",
  domain_first: "Choice 3 — first course on a bought domain",
  domain_extra: "Choice 3 — extra course on that domain",
};

const PRICE_COL: Record<string, string> = {
  cname_diy: "price_cname_diy",
  cname_setup: "price_cname_setup",
  domain_first: "price_domain_first",
  domain_extra: "price_domain_extra",
};

export async function startDomainCheckout(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") || "");
  const kind = String(formData.get("kind") || "");
  const host = cleanHost(String(formData.get("host") || ""));
  const name1 = String(formData.get("name1") || "").trim();
  const name2 = String(formData.get("name2") || "").trim();
  const name3 = String(formData.get("name3") || "").trim();

  if (!courseId || !KIND_LABEL[kind]) redirect("/teacher");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, webapp_slug")
    .eq("id", courseId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!course) redirect("/teacher");

  if (kind === "cname_diy" || kind === "cname_setup") {
    if (!hostOk(host)) redirect(`/teacher/${courseId}/domain?err=host`);
  }
  if ((kind === "domain_first" || kind === "domain_extra") && (!name1 || !name2 || !name3)) {
    redirect(`/teacher/${courseId}/domain?err=names`);
  }
  if (kind === "domain_extra" && !course.webapp_slug) {
    redirect(`/teacher/${courseId}/domain?err=slugfirst`);
  }

  const { data: settings } = await supabase
    .from("platform_settings")
    .select(
      "price_cname_diy, price_cname_setup, price_domain_first, price_domain_extra"
    )
    .eq("id", 1)
    .maybeSingle();

  const col = PRICE_COL[kind];
  const dollars = Number(
    settings ? (settings as Record<string, unknown>)[col] : 0
  );
  if (!dollars || dollars <= 0) {
    redirect(`/teacher/${courseId}/domain?err=price`);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    redirect(`/teacher/${courseId}/domain?err=stripe`);
  }

  const h = await headers();
  const incoming =
    h.get("x-forwarded-host") || h.get("host") || "truknowledge.center";
  const origin = incoming.includes("localhost")
    ? "https://truknowledge.center"
    : `https://${incoming.split(",")[0]}`;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const amount = Math.round(dollars * 100);
  const next = `/teacher/${courseId}/domain`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: `${KIND_LABEL[kind]} — ${course.title}`,
          },
        },
      },
    ],
    metadata: {
      kind: "domain",
      domainKind: kind,
      courseId,
      userId: user.id,
      host,
      name1,
      name2,
      name3,
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent(next)}`,
    cancel_url: `${origin}${next}`,
  });

  if (!session.url) {
    redirect(`/teacher/${courseId}/domain?err=stripe`);
  }
  redirect(session.url);
}

export async function pickSuggestedName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") || "");
  const orderId = String(formData.get("orderId") || "");
  const pick = String(formData.get("pick") || "").trim();
  if (!courseId || !orderId || !pick) {
    redirect(`/teacher/${courseId}/domain`);
  }

  await supabase
    .from("domain_orders")
    .update({ chosen_domain: pick, status: "paid" })
    .eq("id", orderId)
    .eq("teacher_id", user.id);

  redirect(`/teacher/${courseId}/domain?ok=1`);
}

export async function sendMoreNames(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") || "");
  const orderId = String(formData.get("orderId") || "");
  const name1 = String(formData.get("name1") || "").trim();
  const name2 = String(formData.get("name2") || "").trim();
  const name3 = String(formData.get("name3") || "").trim();
  if (!courseId || !orderId || !name1 || !name2 || !name3) {
    redirect(`/teacher/${courseId}/domain?err=names`);
  }

  await supabase
    .from("domain_orders")
    .update({
      name1,
      name2,
      name3,
      suggested1: null,
      suggested2: null,
      suggested3: null,
      chosen_domain: null,
      status: "paid",
    })
    .eq("id", orderId)
    .eq("teacher_id", user.id);

  redirect(`/teacher/${courseId}/domain?ok=1`);
}
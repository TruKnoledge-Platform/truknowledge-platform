import { requireOwner } from "@/lib/is-owner";
import { saveFee, saveDomainPrices } from "./actions";
import IconUpload from "./icon-upload";

export default async function OwnerHome() {
  const { supabase } = await requireOwner();

  const [
    { data: settings },
    { count: courseCount },
    { count: publishedCount },
    { data: teachers },
    { count: enrollmentCount },
    { count: viewCount },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("platform_settings")
      .select(
        "fee_percent, price_cname_diy, price_cname_setup, price_domain_first, price_domain_extra, site_icon_url"
      )
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("teacher_profiles").select("user_id"),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase.from("course_views").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount, teacher_id, created_at"),
  ]);

  const fee = Number(settings?.fee_percent ?? 15);
  const priceDiy = Number(settings?.price_cname_diy ?? 0);
  const priceSetup = Number(settings?.price_cname_setup ?? 0);
  const priceFirst = Number(settings?.price_domain_first ?? 0);
  const priceExtra = Number(settings?.price_domain_extra ?? 0);
  const sales = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const platformTake = sales * (fee / 100);
  const teacherCount = new Set((teachers || []).map((t) => t.user_id)).size;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to site
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Owner back office
        </h1>
        <p className="mt-2 text-sm text-[#9AA3B5]">
          TruKnowledge at a glance. Only you can open this page.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Teachers connected" value={teacherCount} />
          <Stat label="Published courses" value={publishedCount ?? 0} />
          <Stat label="Enrollments" value={enrollmentCount ?? 0} />
          <Stat label="Course views" value={viewCount ?? 0} />
          <Stat label="All courses" value={courseCount ?? 0} />
          <Stat label="Gross sales" value={`$${sales.toFixed(2)}`} />
          <Stat label={`Platform take (${fee}%)`} value={`$${platformTake.toFixed(2)}`} />
          <Stat
            label="Teachers keep"
            value={`$${(sales - platformTake).toFixed(2)}`}
          />
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <h2
            className="text-xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            TruKnowledge icon
          </h2>
          <p className="mt-2 text-sm text-[#9AA3B5]">
            Square image for the browser tab and Add to Home Screen on
            truknowledge.center. PNG or JPG, about 512×512.
          </p>
          <div className="mt-4">
            <IconUpload kind="site" currentUrl={settings?.site_icon_url} />
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-gradient-to-b from-amber-700/50 to-transparent p-6">
          <h2
            className="text-xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Your take on paid courses
          </h2>
          <p className="mt-2 text-sm text-[#9AA3B5]">
            This is the percent TruKnowledge keeps. Teachers keep the rest.
            Stripe’s card fee is extra. New checkouts use this number.
          </p>
          <form action={saveFee} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Percent
              <input
                name="fee"
                type="number"
                min={0}
                max={90}
                step={1}
                defaultValue={fee}
                className="mt-1 block w-28 rounded-lg bg-[#12182A] px-3 py-2 text-[#F3E6D2]"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
            >
              Save
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl bg-gradient-to-b from-sky-800/50 to-transparent p-6">
          <h2
            className="text-xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Web App domain prices (USD)
          </h2>
          <p className="mt-2 text-sm text-[#9AA3B5]">
            Choice 1 (name.truknowledge.center) stays free. Change these any
            time. Stripe will use them when we turn on teacher checkout.
          </p>
          <form action={saveDomainPrices} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Choice 2 — they add the CNAME (DIY)
              <input
                name="price_cname_diy"
                type="number"
                min={0}
                step="0.01"
                defaultValue={priceDiy}
                className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2 text-[#F3E6D2]"
              />
            </label>
            <label className="text-sm">
              Choice 2 — we add the CNAME
              <input
                name="price_cname_setup"
                type="number"
                min={0}
                step="0.01"
                defaultValue={priceSetup}
                className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2 text-[#F3E6D2]"
              />
            </label>
            <label className="text-sm">
              Choice 3 — first course on a bought domain
              <input
                name="price_domain_first"
                type="number"
                min={0}
                step="0.01"
                defaultValue={priceFirst}
                className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2 text-[#F3E6D2]"
              />
            </label>
            <label className="text-sm">
              Choice 3 — each extra course on that domain
              <input
                name="price_domain_extra"
                type="number"
                min={0}
                step="0.01"
                defaultValue={priceExtra}
                className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2 text-[#F3E6D2]"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
              >
                Save domain prices
              </button>
            </div>
          </form>
        </section>

        <p className="mt-8">
          <a href="/owner/people" className="text-[#E8A24A] hover:underline">
            People — teachers and members →
          </a>
        </p>
        <p className="mt-3">
          <a href="/owner/inbox" className="text-[#E8A24A] hover:underline">
            Messages from unlisted members →
          </a>
        </p>
        <p className="mt-3">
          <a href="/owner/contact" className="text-[#E8A24A] hover:underline">
            Contact us messages →
          </a>
        </p>
        <p className="mt-3">
          <a href="/owner/domains" className="text-[#E8A24A] hover:underline">
            Domain orders (Choice 2 and 3) →
          </a>
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12182A] p-4">
      <p className="text-xs uppercase tracking-wide text-[#9AA3B5]">{label}</p>
      <p className="mt-2 text-2xl text-[#E8A24A]">{value}</p>
    </div>
  );
}
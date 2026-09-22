import { requireOwner } from "@/lib/is-owner";

const COORDS: Record<string, [number, number]> = {
  "united states": [39.8, -98.6],
  usa: [39.8, -98.6],
  "united states of america": [39.8, -98.6],
  canada: [56.1, -106.3],
  mexico: [23.6, -102.5],
  brazil: [-14.2, -51.9],
  argentina: [-38.4, -63.6],
  "united kingdom": [54.7, -3.4],
  uk: [54.7, -3.4],
  ireland: [53.1, -8.2],
  france: [46.2, 2.2],
  germany: [51.2, 10.4],
  italy: [41.9, 12.6],
  spain: [40.5, -3.7],
  australia: [-25.3, 133.8],
  "new zealand": [-40.9, 174.9],
  india: [20.6, 79.0],
  japan: [36.2, 138.3],
  "south africa": [-30.6, 22.9],
};

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function bucketOf(key: string, range: "day" | "week" | "month") {
  if (range === "month") return key.slice(0, 7);
  if (range === "week") {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
    return dt.toISOString().slice(0, 10);
  }
  return key;
}

function buckets(range: "day" | "week" | "month") {
  const today = dayKey(new Date());
  const count = range === "day" ? 14 : 12;
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key =
      range === "day"
        ? addDays(today, -i)
        : range === "week"
          ? addDays(today, -i * 7)
          : addDays(today, 0).slice(0, 7);
    if (range === "month") {
      const [y, m] = today.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1 - i, 1));
      labels.push(dt.toISOString().slice(0, 7));
    } else {
      labels.push(bucketOf(key, range));
    }
  }
  return labels;
}

export default async function OwnerVisitors({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: raw } = await searchParams;
  const range = raw === "day" || raw === "month" ? raw : "week";
  const { supabase } = await requireOwner();

  const [{ data: views }, { data: courses }, { data: enrollments }, { data: people }] =
    await Promise.all([
      supabase
        .from("course_views")
        .select("course_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("courses").select("id, title, teacher_id"),
      supabase.from("enrollments").select("country, region").limit(2000),
      supabase.from("profiles").select("id, email"),
    ]);

  const rows = views || [];
  const today = dayKey(new Date());
  const weekAgo = addDays(today, -6);
  const monthAgo = addDays(today, -29);
  const keys = rows.map((row) => dayKey(new Date(row.created_at)));
  const last7 = keys.filter((key) => key >= weekAgo && key <= today).length;
  const last30 = keys.filter((key) => key >= monthAgo && key <= today).length;

  const labels = buckets(range);
  const counts = labels.map(
    (label) =>
      keys.filter((key) => bucketOf(key, range) === label).length
  );
  const maxBar = Math.max(1, ...counts);

  const byCourse = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.course_id) return;
    byCourse.set(row.course_id, (byCourse.get(row.course_id) || 0) + 1);
  });
  const courseRows = [...byCourse.entries()]
    .map(([id, count]) => {
      const course = (courses || []).find((item) => item.id === id);
      const email =
        (people || []).find((person) => person.id === course?.teacher_id)?.email ||
        "";
      return { id, count, title: course?.title || "Removed course", email };
    })
    .sort((a, b) => b.count - a.count);
  const maxCourse = Math.max(1, ...courseRows.map((row) => row.count));

  const placeMap = new Map<string, { country: string; region: string | null; count: number }>();
  (enrollments || []).forEach((row) => {
    if (!row.country) return;
    const key = `${row.country}::${row.region || ""}`;
    const current = placeMap.get(key);
    if (current) current.count += 1;
    else placeMap.set(key, { country: row.country, region: row.region, count: 1 });
  });
  const places = [...placeMap.values()].sort((a, b) => b.count - a.count);
  const maxPlace = Math.max(1, ...places.map((place) => place.count));

  const countryTotals = new Map<string, number>();
  places.forEach((place) => {
    countryTotals.set(place.country, (countryTotals.get(place.country) || 0) + place.count);
  });
  const dots = [...countryTotals.entries()]
    .map(([country, count]) => {
      const pair = COORDS[country.toLowerCase()];
      if (!pair) return null;
      return { country, count, lat: pair[0], lng: pair[1] };
    })
    .filter(Boolean) as { country: string; count: number; lat: number; lng: number }[];

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/owner" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to owner home
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Visitors
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9AA3B5]">
          Course opens, and the country of people who enrolled. Someone who
          only looked at the homepage is not counted. Times are Denver.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Course opens" value={rows.length} />
          <Stat label="Last 7 days" value={last7} />
          <Stat label="Last 30 days" value={last30} />
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-xl text-[#E8A24A]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Opens over time
            </h2>
            <div className="flex gap-2 text-sm">
              {(["day", "week", "month"] as const).map((item) => (
                <a
                  key={item}
                  href={`/owner/visitors?range=${item}`}
                  className={`rounded-full px-4 py-1 ${
                    range === item
                      ? "bg-[#E8A24A] text-[#0B1020]"
                      : "border border-white/15 text-[#F3E6D2]"
                  }`}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1">
            {counts.map((count, index) => (
              <div key={labels[index]} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-[#E8A24A]"
                  style={{
                    height: `${(count / maxBar) * 100}%`,
                    minHeight: count ? 4 : 0,
                  }}
                  title={`${labels[index]}: ${count}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1 text-[10px] text-[#9AA3B5]">
            {labels.map((label) => (
              <span key={label} className="min-w-0 flex-1 truncate text-center">
                {range === "day" ? label.slice(5) : label}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <h2
            className="text-xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Which courses
          </h2>
          <div className="mt-4 space-y-4">
            {!courseRows.length && (
              <p className="text-sm text-[#9AA3B5]">No course opens yet.</p>
            )}
            {courseRows.map((row) => (
              <div key={row.id}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {row.title}
                    {row.email ? (
                      <span className="text-[#9AA3B5]"> · {row.email}</span>
                    ) : null}
                  </span>
                  <span className="text-[#E8A24A]">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-[#E8A24A]"
                    style={{ width: `${(row.count / maxCourse) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#12182A] p-6">
          <h2
            className="text-xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Where enrolled learners are
          </h2>
          <p className="mt-1 text-sm text-[#9AA3B5]">
            Country and region only. Not a street address. Only people who enrolled.
          </p>
          <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0B1020]">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1280px-Equirectangular_projection_SW.jpg"
              alt="World map"
              className="block w-full opacity-80"
            />
            {dots.map((dot) => (
              <span
                key={dot.country}
                title={`${dot.country}: ${dot.count}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8A24A]"
                style={{
                  left: `${((dot.lng + 180) / 360) * 100}%`,
                  top: `${((90 - dot.lat) / 180) * 100}%`,
                  width: Math.max(10, Math.min(22, 8 + dot.count * 4)),
                  height: Math.max(10, Math.min(22, 8 + dot.count * 4)),
                }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {!places.length && (
              <p className="text-sm text-[#9AA3B5]">No locations yet.</p>
            )}
            {places.map((place) => (
              <div key={`${place.country}-${place.region}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {place.country}
                    {place.region ? `, ${place.region}` : ""}
                  </span>
                  <span className="text-[#9AA3B5]">{place.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-[#E8A24A]"
                    style={{ width: `${(place.count / maxPlace) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12182A] p-4">
      <p className="text-xs uppercase tracking-wide text-[#9AA3B5]">{label}</p>
      <p className="mt-2 text-2xl text-[#E8A24A]">{value}</p>
    </div>
  );
}
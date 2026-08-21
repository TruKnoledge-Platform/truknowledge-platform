"use client";

import { useMemo, useState } from "react";

type CourseStat = {
  id: string;
  title: string;
  published: boolean;
  enrollments: number;
  views: number;
};

type Payment = {
  course_id: string;
  amount: number;
  created_at: string;
};

type Place = {
  country: string;
  region: string | null;
  count: number;
};

const COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#facc15"];

const COORDS: Record<string, [number, number]> = {
  "united states": [39.8, -98.6],
  usa: [39.8, -98.6],
  "united states of america": [39.8, -98.6],
  canada: [56.1, -106.3],
  mexico: [23.6, -102.5],
  brazil: [-14.2, -51.9],
  argentina: [-38.4, -63.6],
  chile: [-35.7, -71.5],
  colombia: [4.6, -74.3],
  peru: [-9.2, -75.0],
  "united kingdom": [54.7, -3.4],
  uk: [54.7, -3.4],
  ireland: [53.1, -8.2],
  france: [46.2, 2.2],
  germany: [51.2, 10.4],
  italy: [41.9, 12.6],
  spain: [40.5, -3.7],
  portugal: [39.4, -8.2],
  netherlands: [52.1, 5.3],
  belgium: [50.5, 4.5],
  switzerland: [46.8, 8.2],
  austria: [47.5, 14.6],
  sweden: [62.2, 17.6],
  norway: [64.6, 12.3],
  denmark: [56.3, 9.5],
  finland: [64.0, 26.0],
  poland: [51.9, 19.1],
  greece: [39.1, 21.8],
  turkey: [38.96, 35.2],
  russia: [61.5, 105.3],
  ukraine: [48.4, 31.2],
  romania: [45.9, 24.97],
  "czech republic": [49.8, 15.5],
  czechia: [49.8, 15.5],
  hungary: [47.2, 19.5],
  australia: [-25.3, 133.8],
  "new zealand": [-40.9, 174.9],
  india: [20.6, 79.0],
  china: [35.9, 104.2],
  japan: [36.2, 138.3],
  "south korea": [35.9, 127.8],
  indonesia: [-0.8, 113.9],
  philippines: [12.9, 121.8],
  thailand: [15.9, 100.99],
  vietnam: [14.1, 108.3],
  malaysia: [4.2, 101.98],
  singapore: [1.35, 103.8],
  "south africa": [-30.6, 22.9],
  egypt: [26.8, 30.8],
  nigeria: [9.1, 8.7],
  kenya: [0.02, 37.9],
  morocco: [31.8, -7.1],
  israel: [31.0, 34.9],
  "united arab emirates": [23.4, 53.8],
  uae: [23.4, 53.8],
  "saudi arabia": [23.9, 45.1],
  pakistan: [30.4, 69.3],
  bangladesh: [23.7, 90.4],
  taiwan: [23.7, 121.0],
  "hong kong": [22.3, 114.2],
  "costa rica": [9.75, -83.75],
  panama: [8.5, -80.1],
  guatemala: [15.8, -90.2],
  "puerto rico": [18.2, -66.4],
  iceland: [64.96, -19.0],
  croatia: [45.1, 15.2],
  serbia: [44.0, 21.0],
  bulgaria: [42.7, 25.5],
  slovakia: [48.7, 19.7],
  slovenia: [46.2, 14.99],
  lithuania: [55.2, 23.9],
  latvia: [56.9, 24.6],
  estonia: [58.6, 25.0],
};

function bucketKey(date: Date, range: "day" | "week" | "month") {
  if (range === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (range === "week") {
    const tmp = new Date(date);
    tmp.setDate(tmp.getDate() - tmp.getDay());
    return tmp.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function makeBuckets(range: "day" | "week" | "month") {
  const labels: string[] = [];
  const now = new Date();
  const count = range === "day" ? 14 : 12;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (range === "day") d.setDate(d.getDate() - i);
    if (range === "week") d.setDate(d.getDate() - i * 7);
    if (range === "month") d.setMonth(d.getMonth() - i);
    labels.push(bucketKey(d, range));
  }
  return labels;
}

function pinStyle(lat: number, lng: number) {
  return {
    left: `${((lng + 180) / 360) * 100}%`,
    top: `${((90 - lat) / 180) * 100}%`,
  };
}

export default function TeacherDashboard({
  courses,
  payments,
  places,
}: {
  courses: CourseStat[];
  payments: Payment[];
  places: Place[];
}) {
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const labels = useMemo(() => makeBuckets(range), [range]);
  const maxEnroll = Math.max(1, ...courses.map((c) => c.enrollments));
  const maxViews = Math.max(1, ...courses.map((c) => c.views));
  const maxPlace = Math.max(1, ...places.map((p) => p.count));

  const countryTotals = useMemo(() => {
    const map = new Map<string, number>();
    places.forEach((place) => {
      map.set(place.country, (map.get(place.country) || 0) + place.count);
    });
    return [...map.entries()].map(([country, count]) => ({ country, count }));
  }, [places]);

  const dots = countryTotals
    .map((item) => {
      const pair = COORDS[item.country.toLowerCase()];
      if (!pair) return null;
      return { ...item, lat: pair[0], lng: pair[1] };
    })
    .filter(Boolean) as { country: string; count: number; lat: number; lng: number }[];

  const series = courses.map((course, index) => {
    const points = labels.map((label) =>
      payments
        .filter(
          (p) =>
            p.course_id === course.id &&
            bucketKey(new Date(p.created_at), range) === label
        )
        .reduce((sum, p) => sum + Number(p.amount), 0)
    );
    return { course, color: COLORS[index % COLORS.length], points };
  });

  const maxIncome = Math.max(1, ...series.flatMap((s) => s.points));
  const width = 640;
  const height = 220;
  const pad = 28;

  function linePath(points: number[]) {
    return points
      .map((value, i) => {
        const x = pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
        const y = height - pad - (value / maxIncome) * (height - pad * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Income</h2>
            <p className="text-sm text-slate-400">
              Each line is a course. New paid enrollments appear here.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            {(["day", "week", "month"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-lg px-3 py-1 ${
                  range === item
                    ? "bg-orange-500"
                    : "border border-slate-600 text-slate-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full">
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#334155" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#334155" />
          {series.map((item) => (
            <path
              key={item.course.id}
              d={linePath(item.points)}
              fill="none"
              stroke={item.color}
              strokeWidth="2.5"
            />
          ))}
        </svg>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {series.map((item) => (
            <span key={item.course.id} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.course.title}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="text-lg font-medium">Enrollments and views</h2>
        <p className="text-sm text-slate-400">
          Orange = enrolled. The second column = visits to the course.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {courses.map((course, index) => (
            <div key={course.id}>
              <p className="mb-2 truncate text-sm">{course.title}</p>
              <div className="flex h-28 items-end gap-3">
                <div className="flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-orange-500"
                    style={{
                      height: `${(course.enrollments / maxEnroll) * 100}%`,
                      minHeight: course.enrollments ? 8 : 0,
                    }}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {course.enrollments} enrolled
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t"
                    style={{
                      background: COLORS[index % COLORS.length],
                      height: `${(course.views / maxViews) * 100}%`,
                      minHeight: course.views ? 8 : 0,
                    }}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {course.views} views
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="text-lg font-medium">Where learners are</h2>
        <p className="mt-1 text-sm text-slate-400">
          Real world map. Country and region only — not a street address.
        </p>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-800 bg-[#0B1220]">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1280px-Equirectangular_projection_SW.jpg"
            alt="World map"
            className="block w-full opacity-80"
          />
          {dots.map((dot) => (
            <span
              key={dot.country}
              title={`${dot.country}: ${dot.count}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.35)]"
              style={{
                ...pinStyle(dot.lat, dot.lng),
                width: Math.max(10, Math.min(22, 8 + dot.count * 4)),
                height: Math.max(10, Math.min(22, 8 + dot.count * 4)),
              }}
            />
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {!places.length && (
            <p className="text-sm text-slate-500">
              No locations yet. A new enroll will add the first one.
            </p>
          )}
          {places.map((place) => (
            <div key={`${place.country}-${place.region}`}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {place.country}
                  {place.region ? `, ${place.region}` : ""}
                </span>
                <span className="text-slate-400">{place.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(place.count / maxPlace) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
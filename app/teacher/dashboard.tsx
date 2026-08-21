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
          <line
            x1={pad}
            y1={height - pad}
            x2={width - pad}
            y2={height - pad}
            stroke="#334155"
          />
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
          Country and region only — not a street address.
        </p>
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
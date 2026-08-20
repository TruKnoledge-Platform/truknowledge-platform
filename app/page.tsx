import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold">
          Tru<span className="text-orange-400">Knowledge</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/courses" className="text-slate-300 hover:text-white">
            Courses
          </a>
          <a href="/login" className="text-slate-300 hover:text-white">
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600"
          >
            Sign up
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
          People teaching people
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
          Knowledge passed from
          <br />
          human hands and hearts.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-400">
          A place for teachers to share what they know, and for learners to take
          it in — skills, care, and clear information that can help build a more
          hopeful future. Every course includes a Web App you can open on a
          phone, tablet, or computer.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-16 md:grid-cols-2">
        <div className="rounded-2xl border border-orange-500/40 bg-[#111827] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-400">
            Teachers
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Share what you know</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li>Create courses at no cost. No monthly subscription.</li>
            <li>Every course includes a shareable Web App, managed from the same back office.</li>
            <li>A 10% platform fee only when a learner pays. Stripe’s card fee is extra.</li>
            <li>You keep the relationship with your learners.</li>
          </ul>
          <a
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600"
          >
            Start teaching
          </a>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Learners
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Learn at a human pace</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li>Browse published courses. Watch a sneak peek before you enroll.</li>
            <li>Enroll free or paid. Progress shows START, In progress, or Completed.</li>
            <li>Open the course on the site or through the teacher’s Web App link.</li>
            <li>Works in the browser on iPhone, iPad, Mac, Windows, and Android.</li>
          </ul>
          <a
            href="/courses"
            className="mt-8 inline-block rounded-lg border border-slate-500 px-6 py-3 font-medium text-slate-200 hover:border-orange-500"
          >
            Browse courses
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-medium">Recently added courses</h2>
          <a href="/courses" className="text-sm text-orange-400 hover:underline">
            See all
          </a>
        </div>

        {!courses?.length && (
          <p className="text-sm text-slate-400">No published courses yet.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {courses?.map((course) => (
            <a key={course.id} href={`/courses/${course.id}`} className="group">
              <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No image
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-center text-sm font-medium group-hover:text-orange-400">
                {course.title}
              </h3>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

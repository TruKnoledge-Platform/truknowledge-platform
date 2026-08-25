import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url")
    .eq("is_published", true)
    .eq("owner_paused", false)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2]">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1020]/30 via-[#0B1020]/55 to-[#0B1020]" />

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a
            href="/"
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Tru<span className="text-[#E8A24A]">Knowledge</span>
          </a>
          <nav className="flex items-center gap-5 text-sm text-[#9AA3B5]">
            <a href="/courses" className="hover:text-[#F3E6D2]">
              Courses
            </a>
            {user ? (
              <>
                <a href="/learn" className="hover:text-[#F3E6D2]">
                  My courses
                </a>
                <a href="/teacher" className="hover:text-[#F3E6D2]">
                  Teach
                </a>
                <a href="/auth/signout" className="hover:text-[#F3E6D2]">
                  Sign out
                </a>
              </>
            ) : (
              <>
                <a href="/login" className="hover:text-[#F3E6D2]">
                  Log in
                </a>
                <a
                  href="/signup"
                  className="whitespace-nowrap rounded-full bg-[#E8A24A] px-4 py-2 font-medium text-[#0B1020] hover:bg-amber-300"
                >
                  Join free
                </a>
              </>
            )}
          </nav>
        </header>

        <section className="relative mx-auto max-w-4xl px-6 pb-16 pt-10 text-center md:pt-14">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">
            The way to a new positive future
          </p>
          <h1
            className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.12] font-medium md:text-6xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Connecting true hearts, minds and souls.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-[#F3E6D2]/80">
            Course and Web App. One back office. Every platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={user ? "/teacher" : "/signup"}
              className="rounded-full bg-[#E8A24A] px-8 py-3.5 text-base font-semibold text-[#0B1020] hover:bg-amber-300"
            >
              Start teaching — free
            </a>
            <a
              href="/courses"
              className="rounded-full bg-sky-800 px-8 py-3.5 text-base font-semibold text-[#E8A24A] hover:bg-sky-700"
            >
              Browse as a learner
            </a>
          </div>
        </section>
      </div>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 md:grid-cols-2">
        <article className="rounded-[2rem] bg-gradient-to-b from-amber-700/70 via-amber-950/25 to-transparent p-8 md:p-10">
          <p className="text-xs font-medium tracking-wide text-[#E8A24A]">
            Teachers / News Casters / Natural Science
          </p>
          <h2
            className="mt-3 text-3xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Sharing Experience / Knowledge / Wisdom
          </h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-[15px] leading-7 text-[#F3E6D2] marker:text-[#E8A24A]">
            <li>Join free — no monthly fee</li>
            <li>
              Web App included
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#F3E6D2]/80">
                <li>Immediate changes via the dynamic back office</li>
                <li>
                  Three areas for each session
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>Session · Notes · Extras · Messages</li>
                  </ul>
                </li>
                <li>Create your own domain name for the app</li>
              </ul>
            </li>
            <li>
              Fully adaptive and functional back office
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#F3E6D2]/80">
                <li>Change on the fly to all formats</li>
                <li>Price setting</li>
                <li>Discussion area with students</li>
                <li>See who enrolled and how far they have come</li>
                <li>Keep 85% of what you sell (15% to us, plus Stripe’s card fee)</li>
              </ul>
            </li>
          </ul>
          <a
            href={user ? "/teacher" : "/signup"}
            className="mt-8 inline-flex rounded-full bg-[#E8A24A] px-8 py-3.5 text-base font-semibold text-[#0B1020] hover:bg-amber-300"
          >
            Become a teacher
          </a>
        </article>

        <article className="rounded-[2rem] bg-gradient-to-b from-sky-800/70 via-slate-950/25 to-transparent p-8 md:p-10">
          <p className="text-xs font-medium tracking-wide text-[#E8A24A]">
            Learners / Followers / Technicians
          </p>
          <h2
            className="mt-3 text-3xl text-[#E8A24A]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Open Minded People
          </h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-[15px] leading-7 text-[#F3E6D2] marker:text-[#E8A24A]">
            <li>Find your teacher / news feed / live coverage</li>
            <li>Sneak peek, then enroll — free or a clear price</li>
            <li>Learn on your smartphone / tablet / laptop</li>
            <li>Course starts where you last stopped</li>
            <li>Videos, notes, and extras come with the course</li>
            <li>Message / discussion with teacher</li>
            <li>Works on iPhone, iPad, Mac, Windows, Android</li>
          </ul>
          <a
            href="/courses"
            className="mt-8 inline-flex rounded-full bg-sky-800 px-8 py-3.5 text-base font-semibold text-[#E8A24A] hover:bg-sky-700"
          >
            Discover courses
          </a>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="overflow-hidden rounded-[2rem] border border-[#E8A24A]/30 bg-[#12182A]">
          <div className="grid items-center md:grid-cols-[1.3fr_0.9fr]">
            <div className="p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.28em] text-[#E8A24A]">Web App</p>
              <h2
                className="mt-3 text-3xl md:text-4xl"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                Create the course. Create the app.
              </h2>
              <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#F3E6D2]/85">
                As you create your online course, you are also creating a
                real-time Web App — to use and spread your course even easier,
                on all platforms.
              </p>
            </div>
            <div className="flex justify-center px-8 pb-10 md:pb-0">
              <div className="w-44 rounded-[2rem] border border-white/15 bg-[#0B1020] p-3 shadow-2xl">
                <div className="rounded-2xl bg-[#12182A] p-4">
                  <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
                  <p
                    className="mt-6 text-lg"
                    style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                  >
                    Now playing
                  </p>
                  <div className="mt-3 aspect-video rounded-lg bg-[#E8A24A]/20" />
                  <p className="mt-3 text-xs text-[#9AA3B5]">Session notes · materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-4">
        <div className="mb-8 flex items-end justify-between">
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Recently added courses
          </h2>
          <a href="/courses" className="text-sm text-[#E8A24A] hover:underline">
            See all
          </a>
        </div>

        {!courses?.length && (
          <p className="text-sm text-[#9AA3B5]">No published courses yet.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {courses?.map((course) => (
            <a key={course.id} href={`/courses/${course.id}`} className="group">
              <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#12182A]">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#9AA3B5]">
                    No image
                  </div>
                )}
              </div>
              <h3
                className="mt-3 text-lg group-hover:text-[#E8A24A]"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {course.title}
              </h3>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-xs text-[#9AA3B5]">
        <p
          className="text-sm text-[#F3E6D2]/80"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          TruKnowledge
        </p>
        <p className="mt-3">
          <a href="/contact" className="text-[#E8A24A] hover:underline">
            Contact us
          </a>
        </p>
        <p className="mt-2">The way to a new positive future · Course and Web App</p>
      </footer>
    </main>
  );
}
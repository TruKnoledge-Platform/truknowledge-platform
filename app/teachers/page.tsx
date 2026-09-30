import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "For Christian teachers — TruKnowledge",
  description:
    "A low-cost way for Christian teachers to spread a message — without the app-store gate.",
};

const points = [
  "Build a course. The Web App is created with it.",
  "Students open it in a browser — phone, tablet, or computer.",
  "You keep 85% of paid enrollments. Platform 15% + card fee.",
  "Join free. No monthly subscription.",
];

const works = [
  {
    title: "One course, one Web App",
    body: "When you write the course you are also making a live Web App. Same sessions, notes, extras, and messages. Edits go through at once.",
  },
  {
    title: "Works on the devices people have",
    body: "iPhone, iPad, Android, Mac, Windows. Learners start where they left off. No store download to begin the class.",
  },
  {
    title: "Sessions, notes, extras, messages",
    body: "Each session has a place for the lesson, written notes, extra files, and a thread with you. Sneak peek first, then enroll — free or a clear price.",
  },
  {
    title: "Your own address if you want it",
    body: "Share a TruKnowledge link, or attach a domain so the app lives under a name you choose.",
  },
  {
    title: "You can see who is in the class",
    body: "Enrollments, how far each person has come, and a simple view of country or region — not a street address.",
  },
  {
    title: "You set the price. You keep 85%.",
    body: "Free is allowed (price 0). Paid courses: 85% to you, 15% to the platform, plus Stripe’s card fee. No monthly platform bill.",
  },
];

const stores = [
  "Developer accounts and yearly fees before a single lesson is posted.",
  "Review queues and sudden rule changes that have nothing to do with the teaching.",
  "A large cut of what you charge, on top of the work of keeping two store listings alive.",
  "A system built for large commercial apps, not a parish class or a small body of teaching.",
];

const learners = [
  "Find a teacher and look at the sneak peek.",
  "Enroll free, or at the price on the page.",
  "Watch, read notes, open extras.",
  "Write the teacher if you need to.",
  "Come back later — the course starts where you stopped.",
];

const compare = [
  ["Monthly platform fee", "Often a store tax plus tools around it", "None"],
  ["What the teacher keeps", "Typically 70–85% after the store cut", "85% of the course price (card fee on top)"],
  ["To go live", "Accounts, binaries, review", "Publish from the back office"],
  ["Student opens the class on", "An installed store app", "The browser they already use"],
  ["Who it is for", "Scale consumer products", "Christian teachers and the people they teach"],
];

export default function TeachersLanding() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/" className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
          Tru<span className="text-[#E8A24A]">Knowledge</span>
        </a>
        <nav className="flex items-center gap-5 text-sm text-[#9AA3B5]">
          <a href="/courses" className="hover:text-[#F3E6D2]">
            Courses
          </a>
          <a href="/signup" className="rounded-full bg-[#E8A24A] px-4 py-2 font-medium text-[#0B1020] hover:bg-amber-300">
            Become a teacher
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#E8A24A]">TruKnowledge</p>
        <h1
          className="mt-4 text-4xl leading-tight font-medium md:text-6xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Course + Web App
        </h1>
        <p className="mt-3 text-sm tracking-wide text-[#9AA3B5]">truknowledge.center</p>
        <p
          className="mx-auto mt-8 max-w-2xl text-2xl leading-snug md:text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          A low-cost way for Christian teachers to spread a message — without the app-store gate.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#9AA3B5]">
          I built TruKnowledge so a teacher could put a class online once, keep most of what they charge, and let
          people use it on the phone they already have. No monthly fee. No Apple or Google listing required.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/signup" className="rounded-full bg-[#E8A24A] px-7 py-3 font-medium text-[#0B1020] hover:bg-amber-300">
            Become a teacher
          </a>
          <a href="/courses" className="rounded-full border border-[#E8A24A]/50 px-7 py-3 font-medium text-[#E8A24A] hover:bg-[#E8A24A]/10">
            Discover courses
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">The four points</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {points.map((point, i) => (
            <li key={point} className="rounded-2xl border border-white/10 bg-[#12182A] p-6">
              <span className="font-medium text-[#E8A24A]" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                {i + 1}
              </span>
              <p className="mt-3 text-lg leading-7">{point}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">How the platform works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {works.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#12182A] p-6">
              <h3 className="text-xl" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#9AA3B5]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">Why not the big stores</h2>
        <p className="mt-4 text-lg leading-8">
          Apple and Google sit between a teacher and a student if the class has to live as a native app.
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-[#9AA3B5]">
          {stores.map((line) => (
            <li key={line} className="border-l border-[#E8A24A]/50 pl-4">
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-6 leading-7">TruKnowledge stays on the web so the class can travel without that gate.</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">For the people who learn</h2>
        <ol className="mt-6 space-y-3">
          {learners.map((line, i) => (
            <li key={line} className="flex gap-4 text-base leading-7">
              <span className="text-[#E8A24A]">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">Side by side</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#12182A] text-[#E8A24A]">
              <tr>
                <th className="px-4 py-3 font-medium" />
                <th className="px-4 py-3 font-medium">App stores</th>
                <th className="px-4 py-3 font-medium">TruKnowledge</th>
              </tr>
            </thead>
            <tbody>
              {compare.map(([label, storesCell, ours]) => (
                <tr key={label} className="border-t border-white/10">
                  <th className="px-4 py-4 font-medium text-[#F3E6D2]">{label}</th>
                  <td className="px-4 py-4 text-[#9AA3B5]">{storesCell}</td>
                  <td className="px-4 py-4">{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[#E8A24A]">From the creator</h2>
        <p
          className="mt-6 text-xl leading-8 md:text-2xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          I did not build this as a movement. I built it so a teacher could spread what they already know — at low
          cost, in a back office that stays out of the way, without asking Apple or Google for permission to teach.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/signup" className="rounded-full bg-[#E8A24A] px-7 py-3 font-medium text-[#0B1020] hover:bg-amber-300">
            Become a teacher
          </a>
          <a href="/courses" className="rounded-full border border-[#E8A24A]/50 px-7 py-3 font-medium text-[#E8A24A] hover:bg-[#E8A24A]/10">
            Discover courses
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

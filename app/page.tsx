export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-lg font-semibold">
          Tru<span className="text-orange-400">Knowledge</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <a href="/login" className="text-slate-300 hover:text-white">
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600"
          >
            Start Creating
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="mb-4 text-sm uppercase tracking-wide text-orange-400">
          Course + Web App platform
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Create a Course. Launch a Web App. Manage both in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Teachers build courses. Learners take them. Every course can also
          become a standalone Web App — all from the same back office.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/signup"
            className="rounded-lg bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-600"
          >
            Start Creating
          </a>
          <a
            href="/login"
            className="rounded-lg border border-slate-700 px-6 py-3 text-slate-200 hover:border-orange-500"
          >
            Browse as Learner
          </a>
        </div>
      </section>
    </main>
  );
}
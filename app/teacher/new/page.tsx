"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const templates = [
  {
    id: "classic_linear",
    name: "Classic Linear",
    desc: "Simple top-to-bottom sessions",
    info: "Best for a clear sequence: Session 1, then 2, then 3. Learners move straight through the course. Good for most first courses.",
  },
  {
    id: "card_grid",
    name: "Card Grid",
    desc: "Visual cards for each session",
    info: "Sessions appear as a grid of cards. Better when each session can stand on its own, like topics or modules they can browse.",
  },
  {
    id: "modular_chapters",
    name: "Modular Chapters",
    desc: "Grouped chapters and sessions",
    info: "Sessions are grouped into chapters. Use this for longer courses with sections, like Week 1, Week 2, or Part A / Part B.",
  },
  {
    id: "focused_path",
    name: "Focused Path",
    desc: "One clear path at a time",
    info: "The learner sees one main step at a time, with less distraction. Good for coaching, challenges, or a guided transformation path.",
  },
];

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [template, setTemplate] = useState("classic_linear");
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("courses").insert({
      teacher_id: user.id,
      title,
      description,
      template,
      is_published: false,
      price: Number(price) || 0,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/teacher");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher area
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Create a course</h1>
        <p className="mt-2 text-slate-400">
          Choose a template and add the basics. Price 0 means free.
        </p>

        <form onSubmit={handleCreate} className="mt-8 space-y-6">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <label className="mb-2 block text-sm text-slate-300">Course title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Short description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Price (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">Use 0 for a free course.</p>
          </div>

          <div>
            <p className="mb-3 text-sm text-slate-300">Template</p>
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTemplate(item.id)}
                  className={`rounded-xl border p-4 text-left ${
                    template === item.id
                      ? "border-orange-500 bg-[#1a2332]"
                      : "border-slate-700 bg-[#111827]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{item.name}</div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoOpen(infoOpen === item.id ? null : item.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 text-xs text-slate-300 hover:border-orange-400 hover:text-orange-400"
                    >
                      i
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{item.desc}</div>
                  {infoOpen === item.id && (
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.info}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save draft"}
          </button>
        </form>
      </div>
    </main>
  );
}
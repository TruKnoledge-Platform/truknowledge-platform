"use client";

import { useCallback, useEffect, useState, type PointerEvent } from "react";

type Point = { t: number; price: number; volumeUsd: number };
type Market = {
  symbol: string;
  name: string;
  price: number;
  change24h: number | null;
  change7d: number | null;
  volume24h: number | null;
  marketCap: number | null;
  high24h: number | null;
  low24h: number | null;
  trades24h: number | null;
  history: Point[];
};
type Tape =
  | { ok: true; fetchedAt: string; source: string; markets: Market[] }
  | { ok: false; error: string; fetchedAt: string };

const RANGES = [
  { id: "1d", label: "1d" },
  { id: "1w", label: "1w" },
  { id: "1m", label: "1m" },
  { id: "3m", label: "3m" },
  { id: "ytd", label: "YTD" },
] as const;

const COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#B794F6",
  XRP: "#2DD4BF",
  ADA: "#FB7185",
  CRO: "#F5C518",
};

const HOUR = 60 * 60 * 1000;

function usd(n: number | null | undefined, compact = false) {
  if (n == null || Number.isNaN(n)) return "—";
  if (compact) {
    const a = Math.abs(n);
    if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  }
  if (Math.abs(n) >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}
function pct(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function ints(n: number | null) {
  if (n == null) return "—";
  return Math.round(n).toLocaleString("en-US");
}

function fmtWhen(t: number, range: string) {
  const d = new Date(t);
  if (range === "1d") {
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ComboChart({ history, color, range }: { history: Point[]; color: string; range: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 720;
  const h = 220;
  const pad = { l: 8, r: 8, t: 10, b: 8 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  if (history.length < 2) return null;
  const prices = history.map((p) => p.price);
  const vols = history.map((p) => p.volumeUsd);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const vMax = Math.max(...vols, 1);
  const pSpan = pMax - pMin || 1;
  const barW = Math.max(1.5, innerW / history.length - 1);
  const xAt = (i: number) => pad.l + (i / (history.length - 1)) * innerW;
  const yAt = (price: number) => pad.t + (1 - (price - pMin) / pSpan) * innerH;
  const pricePath = history
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.price).toFixed(1)}`)
    .join(" ");

  function pointFromEvent(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round(((x - pad.l) / innerW) * (history.length - 1));
    setHover(Math.max(0, Math.min(history.length - 1, i)));
  }

  const hp = hover != null ? history[hover] : null;
  const hx = hover != null ? xAt(hover) : 0;
  const hy = hp ? yAt(hp.price) : 0;
  const leftPct = (hx / w) * 100;
  const flip = leftPct > 62;

  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-56 w-full cursor-crosshair touch-none"
        role="img"
        aria-label="Price and volume. Move the cursor to read a print."
        onPointerMove={pointFromEvent}
        onPointerDown={pointFromEvent}
      >
        {history.map((p, i) => {
          const x = xAt(i);
          const bh = (p.volumeUsd / vMax) * innerH * 0.45;
          return (
            <rect
              key={p.t}
              x={x - barW / 2}
              y={h - pad.b - bh}
              width={barW}
              height={bh}
              fill={color}
              opacity={hover === i ? 0.55 : 0.28}
            />
          );
        })}
        <path d={pricePath} fill="none" stroke={color} strokeWidth="2.2" />
        <text x={pad.l} y={12} fill="#9aa0ab" fontSize="10">
          {range === "1d" ? "intraday" : range.toUpperCase()} · hover a print for price and volume
        </text>
        {hp ? (
          <>
            <line
              x1={hx}
              x2={hx}
              y1={pad.t}
              y2={h - pad.b}
              stroke={color}
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />
            <circle cx={hx} cy={hy} r="4.5" fill={color} stroke="#0b0c0e" strokeWidth="1.6" />
          </>
        ) : null}
      </svg>
      {hp ? (
        <div
          className="pointer-events-none absolute z-10 min-w-44 rounded-md border border-[#2a2e36] bg-[#0b0c0e] px-3 py-2.5 text-xs shadow-lg"
          style={{
            left: `${leftPct}%`,
            top: 22,
            transform: flip ? "translateX(calc(-100% - 8px))" : "translateX(10px)",
          }}
        >
          <div className="font-mono text-[#9aa0ab]">{fmtWhen(hp.t, range)}</div>
          <div className="mt-1.5 font-mono tabular-nums text-[#f2f3f5]">Price {usd(hp.price)}</div>
          <div className="mt-0.5 font-mono tabular-nums" style={{ color }}>
            Volume {usd(hp.volumeUsd, true)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TapePage() {
  const [range, setRange] = useState("1w");
  const [data, setData] = useState<Tape | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async (r: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tape?range=${r}`, { cache: "no-store" });
      setData((await res.json()) as Tape);
    } catch (e) {
      setData({
        ok: false,
        fetchedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Could not load tape",
      });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  useEffect(() => {
    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const hour = window.setInterval(() => void load(range), HOUR);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(hour);
    };
  }, [range, load]);

  const markets = data?.ok ? data.markets : [];
  const fetchedAt = data?.ok ? Date.parse(data.fetchedAt) : null;
  const remaining = fetchedAt != null && now != null ? Math.max(0, fetchedAt + HOUR - now) : null;
  const remainLabel =
    remaining == null
      ? "…"
      : `${String(Math.floor(remaining / 60000)).padStart(2, "0")}:${String(
          Math.floor((remaining % 60000) / 1000),
        ).padStart(2, "0")}`;

  return (
    <div className="min-h-dvh bg-[#0b0c0e] text-[#f2f3f5]" style={{ fontFamily: "Source Sans 3, Segoe UI, sans-serif" }}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#2a2e36] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#9aa0ab]">Unlisted tape</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight">The five-coin desk</h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#9aa0ab]">
              Each name has its own color, its own window, and the last day's print. Price is the line; volume is the
              bars. Hover a chart to read that print.
            </p>
            <p className="mt-3 flex flex-wrap gap-3 font-mono text-xs">
              <span style={{ color: "#F7931A" }}>BTC orange</span>
              <span style={{ color: "#B794F6" }}>ETH violet</span>
              <span style={{ color: "#2DD4BF" }}>XRP teal</span>
              <span style={{ color: "#FB7185" }}>ADA rose</span>
              <span style={{ color: "#F5C518" }}>CRO gold</span>
            </p>
          </div>
          <div className="rounded-lg border border-[#2a2e36] bg-[#14161a] px-4 py-3 text-sm">
            <div className="font-mono text-xs uppercase tracking-wider text-[#9aa0ab]">Status</div>
            <div>{busy ? "Updating…" : data?.ok ? "Live" : "Paused"}</div>
            <div className="font-mono text-xs text-[#9aa0ab]">
              {now != null && fetchedAt ? new Date(fetchedAt).toLocaleString() : "—"}
            </div>
            <div className="text-xs text-[#9aa0ab]">Next refresh in {remainLabel}</div>
          </div>
        </header>

        <div className="space-y-5">
          {markets.map((m) => {
            const color = COLORS[m.symbol] || "#d7dbe3";
            const up = (m.change24h ?? 0) >= 0;
            return (
              <article
                key={m.symbol}
                className="overflow-hidden rounded-lg border border-[#2a2e36] bg-[#14161a]"
                style={{ boxShadow: `inset 0 3px 0 ${color}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2a2e36] px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="font-mono text-xs tracking-[0.16em]" style={{ color }}>
                        {m.symbol}
                      </span>
                    </div>
                    <h2 className="mt-1 font-serif text-2xl" style={{ color }}>
                      {m.name}
                    </h2>
                    <p className="mt-1 font-mono text-3xl tabular-nums">{usd(m.price)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#9aa0ab]">24h</div>
                    <div className={`font-mono text-lg ${up ? "text-[#7dcea0]" : "text-[#e08b8b]"}`}>
                      {pct(m.change24h)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-4 text-sm leading-relaxed text-[#9aa0ab] sm:grid-cols-2">
                  <p>
                    Daily volume is <span className="font-mono text-[#f2f3f5]">{usd(m.volume24h, true)}</span>. The
                    session traded between <span className="font-mono">{usd(m.low24h)}</span> and{" "}
                    <span className="font-mono">{usd(m.high24h)}</span>
                    {m.trades24h != null ? (
                      <>
                        {" "}
                        across <span className="font-mono">{ints(m.trades24h)}</span> prints on Kraken
                      </>
                    ) : null}
                    .
                  </p>
                  <p>
                    Market cap sits at <span className="font-mono text-[#f2f3f5]">{usd(m.marketCap, true)}</span>.
                    Seven-day change is{" "}
                    <span className={`font-mono ${(m.change7d ?? 0) >= 0 ? "text-[#7dcea0]" : "text-[#e08b8b]"}`}>
                      {pct(m.change7d)}
                    </span>
                    {m.symbol === "XRP" ? ". XRP is the Ripple ledger asset" : ""}.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 px-4">
                  {RANGES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRange(opt.id)}
                      className="min-h-10 rounded-full border px-3 text-sm"
                      style={
                        range === opt.id
                          ? { background: color, borderColor: color, color: "#0b0c0e" }
                          : { background: "#1b1e24", borderColor: "#2a2e36", color: "#f2f3f5" }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="px-2 pb-3 pt-2 sm:px-4">
                  {m.history.length > 1 ? (
                    <ComboChart history={m.history} color={color} range={range} />
                  ) : (
                    <p className="py-16 text-center text-sm text-[#9aa0ab]">Chart loading…</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-[#6e7480]">Public market feeds. Not investment advice.</p>
      </main>
    </div>
  );
}

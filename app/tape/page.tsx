"use client";

import { useCallback, useEffect, useState } from "react";

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
  ETH: "#627EEA",
  XRP: "#00AAE4",
  ADA: "#3CC8FF",
  CRO: "#00A0E8",
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

function ComboChart({ history, color, range }: { history: Point[]; color: string; range: string }) {
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
  const pricePath = history
    .map((p, i) => {
      const x = pad.l + (i / (history.length - 1)) * innerW;
      const y = pad.t + (1 - (p.price - pMin) / pSpan) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full" role="img" aria-label="Price and volume">
      {history.map((p, i) => {
        const x = pad.l + (i / (history.length - 1)) * innerW;
        const bh = (p.volumeUsd / vMax) * innerH * 0.45;
        return (
          <rect
            key={p.t}
            x={x - barW / 2}
            y={h - pad.b - bh}
            width={barW}
            height={bh}
            fill={color}
            opacity="0.28"
          />
        );
      })}
      <path d={pricePath} fill="none" stroke={color} strokeWidth="2.2" />
      <text x={pad.l} y={12} fill="#9aa0ab" fontSize="10">
        {range === "1d" ? "intraday" : range.toUpperCase()} · line price · bars volume
      </text>
    </svg>
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
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#9aa0ab]">Live market tape</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight">One window per coin</h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#9aa0ab]">
              Daily activity in text. Price (line) and volume (bars) on one chart. This page is not linked from the
              TruKnowledge home.
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
                      <span className="font-mono text-xs tracking-[0.16em] text-[#9aa0ab]">{m.symbol}</span>
                    </div>
                    <h2 className="mt-1 font-serif text-2xl">{m.name}</h2>
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

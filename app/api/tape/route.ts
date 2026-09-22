import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ASSETS = [
  { krakenPair: "XBTUSD", symbol: "BTC", name: "Bitcoin" },
  { krakenPair: "ETHUSD", symbol: "ETH", name: "Ethereum" },
  { krakenPair: "XRPUSD", symbol: "XRP", name: "XRP" },
  { krakenPair: "ADAUSD", symbol: "ADA", name: "Cardano" },
  { krakenPair: "CROUSD", symbol: "CRO", name: "Cronos" },
] as const;

const RANGES: Record<string, { interval: number; days: number }> = {
  "1d": { interval: 15, days: 1 },
  "1w": { interval: 60, days: 7 },
  "1m": { interval: 240, days: 30 },
  "3m": { interval: 1440, days: 90 },
  ytd: { interval: 1440, days: 0 },
};

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickSeries(result: Record<string, unknown>): number[][] {
  for (const [key, value] of Object.entries(result)) {
    if (key === "last") continue;
    if (Array.isArray(value)) return value as number[][];
  }
  return [];
}

function downsample<T>(points: T[], max = 140): T[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const out: T[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i] as T);
  const last = points[points.length - 1] as T;
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function sinceMs(range: string) {
  if (range === "ytd") return Date.UTC(new Date().getUTCFullYear(), 0, 1);
  const days = RANGES[range]?.days || 7;
  return Date.now() - days * 86_400_000;
}

export async function GET(req: NextRequest) {
  const rangeRaw = req.nextUrl.searchParams.get("range") || "1w";
  const range = RANGES[rangeRaw] ? rangeRaw : "1w";
  const interval = RANGES[range]!.interval;
  const since = sinceMs(range);

  try {
    const pairs = ASSETS.map((a) => a.krakenPair).join(",");
    const [loreRes, tickerRes, ...ohlcRes] = await Promise.all([
      fetch("https://api.coinlore.net/api/tickers/?start=0&limit=120", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairs}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      ...ASSETS.map((a) =>
        fetch(`https://api.kraken.com/0/public/OHLC?pair=${a.krakenPair}&interval=${interval}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }),
      ),
    ]);

    const loreJson = loreRes.ok ? ((await loreRes.json()) as { data?: Array<Record<string, string>> }) : { data: [] };
    const lore: Record<string, Record<string, string>> = {};
    for (const row of loreJson.data ?? []) {
      if (row.symbol) lore[row.symbol] = row;
    }

    const tickerJson = tickerRes.ok
      ? ((await tickerRes.json()) as {
          result?: Record<string, { c?: string[]; h?: string[]; l?: string[]; v?: string[]; p?: string[]; t?: number[] }>;
        })
      : { result: {} };
    const tickers = tickerJson.result ?? {};

    const markets = await Promise.all(
      ASSETS.map(async (asset, i) => {
        const ohlcJson = ohlcRes[i]?.ok
          ? ((await ohlcRes[i]!.json()) as { result?: Record<string, unknown> })
          : { result: {} };
        const series = pickSeries(ohlcJson.result ?? {});
        const history = downsample(
          series
            .filter((row) => Array.isArray(row) && row.length >= 7)
            .map((row) => {
              const t = Number(row[0]) * 1000;
              const close = Number(row[4]);
              const vwap = Number(row[5]) || close;
              const vol = Number(row[6]) || 0;
              return { t, price: close, volumeUsd: vol * vwap };
            })
            .filter((p) => p.price > 0 && p.t >= since),
        );

        const snap = lore[asset.symbol];
        const kraken =
          tickers[asset.krakenPair] ||
          Object.entries(tickers).find(([k]) => k.includes(asset.krakenPair))?.[1];
        const price = num(snap?.price_usd) ?? num(kraken?.c?.[0]) ?? history.at(-1)?.price ?? 0;
        let change24h = num(snap?.percent_change_24h);
        if (change24h == null && history.length > 1 && price) {
          const cutoff = Date.now() - 86_400_000;
          const past = [...history].reverse().find((p) => p.t <= cutoff) ?? history[0];
          if (past?.price) change24h = ((price - past.price) / past.price) * 100;
        }
        let change7d = num(snap?.percent_change_7d);
        if (change7d == null && history[0]?.price && price) {
          change7d = ((price - history[0].price) / history[0].price) * 100;
        }

        return {
          symbol: asset.symbol,
          name: snap?.name || asset.name,
          price,
          change24h,
          change7d,
          volume24h: num(snap?.volume24) ?? (num(kraken?.v?.[1]) ?? 0) * (num(kraken?.p?.[1]) ?? price),
          marketCap: num(snap?.market_cap_usd),
          high24h: num(kraken?.h?.[1]),
          low24h: num(kraken?.l?.[1]),
          trades24h: kraken?.t?.[1] ?? kraken?.t?.[0] ?? null,
          history,
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      source: "Coinlore + Kraken",
      range,
      markets,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Market data unavailable",
    });
  }
}

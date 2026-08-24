import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "";
  const onRoot =
    host === "truknowledge.center" ||
    host.endsWith(".truknowledge.center");

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    onRoot
      ? { cookieOptions: { domain: ".truknowledge.center", path: "/" } }
      : undefined
  );
}
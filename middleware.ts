import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROOT = "truknowledge.center";

function cookieDomain(host: string) {
  const h = host.split(":")[0].toLowerCase();
  if (h === ROOT || h.endsWith(`.${ROOT}`)) return `.${ROOT}`;
  return undefined;
}

function webAppSlug(host: string) {
  const h = host.split(":")[0].toLowerCase();
  if (h === ROOT || h === `www.${ROOT}`) return null;
  if (!h.endsWith(`.${ROOT}`)) return null;
  const slug = h.slice(0, -(ROOT.length + 1));
  if (!slug || slug === "www") return null;
  return slug;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const host = request.headers.get("host") || "";
  const domain = cookieDomain(host);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(domain ? { domain } : {}),
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const slug = webAppSlug(host);

  if (slug && (path === "/" || path === "")) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, is_published, owner_paused")
      .eq("webapp_slug", slug)
      .maybeSingle();

    if (course?.id && course.is_published && !course.owner_paused) {
      const url = request.nextUrl.clone();
      url.pathname = `/webapp/${course.id}`;
      const rewrite = NextResponse.rewrite(url);
      supabaseResponse.cookies.getAll().forEach((c) => {
        rewrite.cookies.set(c.name, c.value);
      });
      return rewrite;
    }
  }

  const allowed =
    path.startsWith("/unlisted") ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth") ||
    path.startsWith("/owner");

  if (user && !allowed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_paused, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_paused && profile.role !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/unlisted";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
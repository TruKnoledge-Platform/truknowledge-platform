import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROOT = "truknowledge.center";

function cookieDomain(host: string) {
  const h = host.split(":")[0].toLowerCase();
  if (h === ROOT || h.endsWith(`.${ROOT}`)) return `.${ROOT}`;
  return undefined;
}

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0].trim().split(":")[0].toLowerCase();
  const host = request.headers.get("host") || request.nextUrl.hostname || "";
  return host.split(":")[0].toLowerCase();
}

function webAppSlug(host: string) {
  if (host === ROOT || host === `www.${ROOT}`) return null;
  if (!host.endsWith(`.${ROOT}`)) return null;
  const slug = host.slice(0, -(ROOT.length + 1));
  if (!slug || slug === "www") return null;
  return slug;
}

async function rewriteToCourse(
  request: NextRequest,
  supabaseResponse: NextResponse,
  courseId: string
) {
  const url = request.nextUrl.clone();
  url.pathname = `/webapp/${courseId}`;
  const rewrite = NextResponse.rewrite(url);
  supabaseResponse.cookies.getAll().forEach((c) => {
    rewrite.cookies.set(c.name, c.value);
  });
  return rewrite;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const host = requestHost(request);
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
          cookiesToSet.forEach(({ name, value }) =>
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

  await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const slug = webAppSlug(host);

  if (slug && (path === "/" || path === "")) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("webapp_slug", slug)
      .maybeSingle();
    if (course?.id) {
      return rewriteToCourse(request, supabaseResponse, course.id);
    }
  }

  const isOwnHost =
    host === ROOT ||
    host === `www.${ROOT}` ||
    host.endsWith(`.${ROOT}`) ||
    host.endsWith(".vercel.app");

  const reserved =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth") ||
    path.startsWith("/learn") ||
    path.startsWith("/api") ||
    path.startsWith("/teacher") ||
    path.startsWith("/owner") ||
    path.startsWith("/checkout") ||
    path.startsWith("/webapp") ||
    path.startsWith("/unlisted") ||
    path.startsWith("/payouts") ||
    path.startsWith("/courses");

  if (!isOwnHost && !reserved) {
    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("user_id")
      .eq("bought_domain", host.replace(/^www\./, ""))
      .maybeSingle();

    if (teacher?.user_id) {
      if (path === "/" || path === "") {
        const url = request.nextUrl.clone();
        url.pathname = `/webapp/hub/${teacher.user_id}`;
        const rewrite = NextResponse.rewrite(url);
        supabaseResponse.cookies.getAll().forEach((c) => {
          rewrite.cookies.set(c.name, c.value);
        });
        return rewrite;
      }
      const pathSlug = path.replace(/^\//, "").split("/")[0];
      if (pathSlug) {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("teacher_id", teacher.user_id)
          .eq("webapp_slug", pathSlug)
          .maybeSingle();
        if (course?.id) {
          return rewriteToCourse(request, supabaseResponse, course.id);
        }
      }
    }

    if (path === "/" || path === "") {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("custom_host", host)
        .maybeSingle();
      if (course?.id) {
        return rewriteToCourse(request, supabaseResponse, course.id);
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
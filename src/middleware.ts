import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routePermissions } from "@/lib/roles";

// Build protected paths from the single source of truth
const protectedPaths = routePermissions.map((r) => r.path);

export async function middleware(request: NextRequest) {
  // Skip if Supabase env vars not available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            // Safari ITP fix: use strict sameSite with secure in production
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // Allow JS access for Supabase client
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          }),
        );
      },
    },
  });

  // IMPORTANT: This refreshes the session if expired and sets new cookies
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Protected routes - redirect to login if not authenticated
  const isProtectedPath = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"),
  );

  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged in users away from auth pages and landing page
  const authPaths = ["/login", "/signup"];
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isLandingPage = request.nextUrl.pathname === "/";

  if ((isAuthPath || isLandingPage) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

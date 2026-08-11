import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // If Supabase authentication fails, don't crash the middleware.
  if (userError) {
    console.error("Supabase middleware auth error:", userError);
  }

  const path = request.nextUrl.pathname;

  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");

  // Dashboard/Admin require authentication
  if ((isDashboard || isAdmin) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);

    return NextResponse.redirect(loginUrl);
  }

  // Admin area requires an allowed role
  if (isAdmin && user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile role lookup error:", profileError);

      return NextResponse.redirect(new URL("/", request.url));
    }

    if (
      !profile ||
      !["admin", "editor", "moderator"].includes(profile.role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};

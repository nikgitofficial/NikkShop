import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
  });

  const { pathname } = req.nextUrl;
  const role = (token as any)?.role;

  if (pathname.startsWith("/admin")) {
    if (!token || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin", req.url));
    }
  }

  if (pathname.startsWith("/seller")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/seller", req.url));
    }
    if (role !== "SELLER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/checkout")
  ) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/checkout/:path*",
  ],
};
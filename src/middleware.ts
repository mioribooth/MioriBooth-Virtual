import { NextRequest, NextResponse } from "next/server";
import { verifyVendorToken, VENDOR_COOKIE_NAME } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith("/dashboard/booth-virtual");
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(VENDOR_COOKIE_NAME)?.value;
  const payload = token ? await verifyVendorToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/dashboard/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/booth-virtual/:path*"],
};

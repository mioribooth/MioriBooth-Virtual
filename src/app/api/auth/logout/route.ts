import { NextResponse } from "next/server";
import { VENDOR_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}

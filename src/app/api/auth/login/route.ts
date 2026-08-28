import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signVendorToken, VENDOR_COOKIE_NAME } from "@/lib/auth";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/session";

/** Ambil IP client dari header proxy (Vercel/umumnya set x-forwarded-for). */
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const okRate = await checkLoginRateLimit(ip, email);
  if (!okRate) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login, coba lagi dalam 15 menit" },
      { status: 429 }
    );
  }

  const vendor = await prisma.vendor.findUnique({ where: { email } });
  if (!vendor) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, vendor.password);
  if (!valid) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  await clearLoginRateLimit(ip, email);

  const token = await signVendorToken({ vendorId: vendor.id, email: vendor.email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

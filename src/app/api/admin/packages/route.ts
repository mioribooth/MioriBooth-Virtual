import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function GET() {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const packages = await prisma.boothPackage.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json(packages);
}

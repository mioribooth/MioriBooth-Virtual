import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function GET() {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await prisma.colorFilter.findMany({
    where: { vendorId: vendor.vendorId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(filters);
}

export async function POST(req: NextRequest) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, lutFileUrl, lutSize } = body ?? {};

  if (!name || !lutFileUrl || !lutSize) {
    return NextResponse.json(
      { error: "name, lutFileUrl, dan lutSize wajib diisi" },
      { status: 400 }
    );
  }

  const count = await prisma.colorFilter.count({ where: { vendorId: vendor.vendorId } });

  const filter = await prisma.colorFilter.create({
    data: {
      vendorId: vendor.vendorId,
      name,
      lutFileUrl,
      lutSize,
      order: count,
    },
  });

  return NextResponse.json(filter, { status: 201 });
}

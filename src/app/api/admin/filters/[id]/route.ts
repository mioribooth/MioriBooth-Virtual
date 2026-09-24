import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = await prisma.colorFilter.findFirst({
    where: { id: params.id, vendorId: vendor.vendorId },
  });
  if (!filter) {
    return NextResponse.json({ error: "Filter tidak ditemukan" }, { status: 404 });
  }

  await prisma.colorFilter.delete({ where: { id: filter.id } });

  return NextResponse.json({ ok: true });
}

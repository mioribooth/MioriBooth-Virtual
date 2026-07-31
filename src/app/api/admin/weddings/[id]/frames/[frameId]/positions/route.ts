import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; frameId: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const frame = await prisma.frameTemplate.findFirst({
    where: {
      id: params.frameId,
      weddingId: params.id,
      wedding: { vendorId: vendor.vendorId },
    },
  });
  if (!frame) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const slotPositions = body?.slotPositions;
  if (!Array.isArray(slotPositions)) {
    return NextResponse.json({ error: "slotPositions harus array" }, { status: 400 });
  }

  const updated = await prisma.frameTemplate.update({
    where: { id: frame.id },
    data: { slotPositions: JSON.stringify(slotPositions) },
  });

  return NextResponse.json(updated);
}

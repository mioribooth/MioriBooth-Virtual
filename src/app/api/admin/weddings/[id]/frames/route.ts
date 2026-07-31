import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wedding = await prisma.wedding.findFirst({
    where: { id: params.id, vendorId: vendor.vendorId },
  });
  if (!wedding) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const {
    name,
    type, // "PHOTO" | "VIDEO"
    overlayImageUrl,
    overlayPublicId,
    frameWidth,
    frameHeight,
    previewUrl,
  } = body ?? {};

  if (!name || !type || !overlayImageUrl || !overlayPublicId || !frameWidth || !frameHeight) {
    return NextResponse.json(
      { error: "name, type, overlayImageUrl, overlayPublicId, frameWidth, frameHeight wajib diisi" },
      { status: 400 }
    );
  }

  const slotCount = type === "VIDEO" ? 1 : 3;

  // Default slot positions awal (ditumpuk vertikal simetris) — vendor bisa geser lewat Frame Editor nanti.
  const defaultSlots =
    slotCount === 1
      ? [{ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }]
      : Array.from({ length: slotCount }).map((_, i) => ({
          x: 0.08,
          y: 0.05 + i * 0.31,
          width: 0.84,
          height: 0.27,
        }));

  const frame = await prisma.frameTemplate.create({
    data: {
      weddingId: wedding.id,
      name,
      type,
      slotCount,
      overlayImageUrl,
      overlayPublicId,
      frameWidth,
      frameHeight,
      previewUrl: previewUrl ?? overlayImageUrl,
      slotPositions: JSON.stringify(defaultSlots),
      order: 0,
    },
  });

  return NextResponse.json(frame, { status: 201 });
}

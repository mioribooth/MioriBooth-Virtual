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
    slotCount: requestedSlotCount,
  } = body ?? {};

  if (!name || !type || !overlayImageUrl || !overlayPublicId || !frameWidth || !frameHeight) {
    return NextResponse.json(
      { error: "name, type, overlayImageUrl, overlayPublicId, frameWidth, frameHeight wajib diisi" },
      { status: 400 }
    );
  }

  // Video selalu 1 slot. Foto sekarang bisa 1/2/3 slot (vendor pilih di form) —
  // default ke 3 kalau nilainya gak valid, biar konsisten sama behavior lama.
  const slotCount =
    type === "VIDEO"
      ? 1
      : [1, 2, 3].includes(Number(requestedSlotCount))
        ? Number(requestedSlotCount)
        : 3;

  // Default slot positions awal (ditumpuk vertikal simetris, jarak rata) —
  // vendor bisa geser lewat Frame Editor nanti. Dibikin generik biar jalan
  // buat berapa pun jumlah slotnya (1, 2, 3, dst).
  const defaultSlots =
    slotCount === 1
      ? [{ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }]
      : (() => {
          const gap = 0.03;
          const marginY = 0.05;
          const height = (1 - marginY * 2 - gap * (slotCount - 1)) / slotCount;
          return Array.from({ length: slotCount }).map((_, i) => ({
            x: 0.08,
            y: marginY + i * (height + gap),
            width: 0.84,
            height,
          }));
        })();

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
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

  return NextResponse.json(frame);
}

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
  const { name, overlayImageUrl, overlayPublicId, frameWidth, frameHeight, previewUrl } =
    body ?? {};

  const updated = await prisma.frameTemplate.update({
    where: { id: frame.id },
    data: {
      ...(name ? { name } : {}),
      ...(overlayImageUrl && overlayPublicId && frameWidth && frameHeight
        ? {
            overlayImageUrl,
            overlayPublicId,
            frameWidth,
            frameHeight,
            previewUrl: previewUrl ?? overlayImageUrl,
          }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
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
    include: { _count: { select: { submissions: true } } },
  });
  if (!frame) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  // GuestSubmission.frameId tidak di-cascade (biar hasil tamu yang sudah
  // tersimpan gak ikut ilang cuma gara-gara framenya dihapus) — jadi frame
  // yang sudah pernah dipakai tamu tidak boleh dihapus, harus dikasih tau
  // eksplisit ke vendor kenapa gagal.
  if (frame._count.submissions > 0) {
    return NextResponse.json(
      {
        error: `Frame ini sudah dipakai ${frame._count.submissions} submission tamu, tidak bisa dihapus.`,
      },
      { status: 409 }
    );
  }

  await prisma.frameTemplate.delete({ where: { id: frame.id } });

  return NextResponse.json({ ok: true });
}

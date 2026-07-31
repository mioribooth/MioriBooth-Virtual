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

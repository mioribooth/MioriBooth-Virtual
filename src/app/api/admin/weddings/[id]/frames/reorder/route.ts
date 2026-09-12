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
    select: { id: true },
  });
  if (!wedding) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const frameIds: unknown = body?.frameIds;
  if (!Array.isArray(frameIds) || frameIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "frameIds harus array of string" }, { status: 400 });
  }

  // Pastikan semua frameIds yang dikirim beneran milik wedding ini (bukan
  // punya wedding/vendor lain) sebelum nulis apa pun.
  const existing = await prisma.frameTemplate.findMany({
    where: { weddingId: wedding.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((f) => f.id));
  const incomingIds = frameIds as string[];
  if (
    incomingIds.length !== existingIds.size ||
    !incomingIds.every((id) => existingIds.has(id))
  ) {
    return NextResponse.json(
      { error: "Daftar frameIds tidak cocok dengan frame yang ada di wedding ini" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    incomingIds.map((id, index) =>
      prisma.frameTemplate.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}

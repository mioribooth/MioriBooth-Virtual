import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wedding = await prisma.wedding.findFirst({
    where: { id: params.id, vendorId: vendor.vendorId },
    include: {
      package: true,
      frames: { orderBy: { order: "asc" } },
      _count: { select: { submissions: true } },
    },
  });

  if (!wedding) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(wedding);
}

export async function DELETE(
  _req: NextRequest,
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

  // FrameTemplate dan GuestSubmission punya onDelete: Cascade di schema,
  // jadi otomatis ikut terhapus bersama wedding ini.
  await prisma.wedding.delete({ where: { id: wedding.id } });

  return NextResponse.json({ ok: true });
}

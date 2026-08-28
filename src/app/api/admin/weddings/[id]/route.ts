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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.wedding.findFirst({
    where: { id: params.id, vendorId: vendor.vendorId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const {
    groomName,
    brideName,
    eventDate,
    packageId,
    coverImageUrl,
    welcomeText,
    clientPhone,
    clientAddress,
  } = body ?? {};

  if (!groomName || !brideName || !eventDate || !packageId) {
    return NextResponse.json(
      { error: "groomName, brideName, eventDate, packageId wajib diisi" },
      { status: 400 }
    );
  }

  const pkg = await prisma.boothPackage.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
  }

  // Tanggal acara atau paket berubah → hitung ulang tanggal akses berakhir,
  // supaya tetap konsisten dengan logika saat wedding pertama kali dibuat.
  const eventDateObj = new Date(eventDate);
  const accessExpiresAt = new Date(eventDateObj);
  accessExpiresAt.setDate(accessExpiresAt.getDate() + pkg.accessDurationDays);

  const wedding = await prisma.wedding.update({
    where: { id: existing.id },
    data: {
      groomName,
      brideName,
      eventDate: eventDateObj,
      packageId,
      coverImageUrl: coverImageUrl ?? null,
      welcomeText: welcomeText || null,
      clientPhone: clientPhone || null,
      clientAddress: clientAddress || null,
      accessExpiresAt,
    },
  });

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

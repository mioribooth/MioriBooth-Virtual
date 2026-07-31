import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import { randomUUID } from "crypto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const weddings = await prisma.wedding.findMany({
    where: { vendorId: vendor.vendorId },
    include: { package: true, _count: { select: { submissions: true, frames: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(weddings);
}

export async function POST(req: NextRequest) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { groomName, brideName, eventDate, packageId, coverImageUrl, welcomeText } = body ?? {};

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

  const baseSlug = slugify(`${groomName}-${brideName}`);
  const uniqueSuffix = randomUUID().slice(0, 6);
  const slug = `${baseSlug}-${uniqueSuffix}`;
  const gallerySlug = `${baseSlug}-gallery-${randomUUID().slice(0, 6)}`;

  const eventDateObj = new Date(eventDate);
  const accessExpiresAt = new Date(eventDateObj);
  accessExpiresAt.setDate(accessExpiresAt.getDate() + pkg.accessDurationDays);

  const wedding = await prisma.wedding.create({
    data: {
      slug,
      gallerySlug,
      vendorId: vendor.vendorId,
      packageId,
      groomName,
      brideName,
      eventDate: eventDateObj,
      coverImageUrl: coverImageUrl ?? null,
      welcomeText: welcomeText ?? null,
      accessExpiresAt,
    },
  });

  return NextResponse.json(wedding, { status: 201 });
}

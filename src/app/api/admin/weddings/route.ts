import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Cari slug unik: coba base dulu, kalau sudah dipakai baru tambah -2, -3, dst. */
async function findUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  if (!(await isTaken(base))) return base;
  let n = 2;
  while (await isTaken(`${base}-${n}`)) {
    n++;
  }
  return `${base}-${n}`;
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
  const slug = await findUniqueSlug(baseSlug, async (candidate) => {
    const existing = await prisma.wedding.findUnique({ where: { slug: candidate } });
    return !!existing;
  });
  const gallerySlug = await findUniqueSlug(`${baseSlug}-gallery`, async (candidate) => {
    const existing = await prisma.wedding.findUnique({ where: { gallerySlug: candidate } });
    return !!existing;
  });

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

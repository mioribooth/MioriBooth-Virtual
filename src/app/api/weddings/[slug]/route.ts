import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const wedding = await prisma.wedding.findUnique({
    where: { slug: params.slug },
    include: {
      package: true,
      frames: { orderBy: { order: "asc" } },
    },
  });

  if (!wedding || !wedding.isActive) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  const isExpired = new Date() > wedding.accessExpiresAt;

  return NextResponse.json({
    id: wedding.id,
    slug: wedding.slug,
    gallerySlug: wedding.gallerySlug,
    groomName: wedding.groomName,
    brideName: wedding.brideName,
    eventDate: wedding.eventDate,
    coverImageUrl: wedding.coverImageUrl,
    welcomeText: wedding.welcomeText,
    mediaMode: wedding.package.mediaMode,
    accessExpiresAt: wedding.accessExpiresAt,
    isExpired,
    frames: isExpired
      ? []
      : wedding.frames.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          slotCount: f.slotCount,
          overlayImageUrl: f.overlayImageUrl,
          previewUrl: f.previewUrl ?? f.overlayImageUrl,
        })),
  });
}

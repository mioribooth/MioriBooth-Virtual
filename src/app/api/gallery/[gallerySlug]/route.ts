import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { gallerySlug: string } }
) {
  const wedding = await prisma.wedding.findUnique({
    where: { gallerySlug: params.gallerySlug },
    include: {
      submissions: { where: { isHidden: false }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!wedding) {
    return NextResponse.json({ error: "Galeri tidak ditemukan" }, { status: 404 });
  }

  const isExpired = new Date() > wedding.accessExpiresAt;

  return NextResponse.json({
    groomName: wedding.groomName,
    brideName: wedding.brideName,
    eventDate: wedding.eventDate,
    accessExpiresAt: wedding.accessExpiresAt,
    isExpired,
    submissions: isExpired
      ? []
      : wedding.submissions.map((s) => ({
          id: s.id,
          guestName: s.guestName,
          mediaType: s.mediaType,
          composedUrl: s.composedUrl,
          voiceNoteUrl: s.voiceNoteUrl,
          voiceDuration: s.voiceDuration,
          createdAt: s.createdAt,
        })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWizardSession, clearWizardSession, checkSubmissionRateLimit } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "token wajib diisi" }, { status: 400 });
  }

  const okRate = await checkSubmissionRateLimit(token);
  if (!okRate) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan, coba lagi sebentar lagi" },
      { status: 429 }
    );
  }

  const session = await getWizardSession(token);
  if (!session || !session.frameId || !session.composedUrl) {
    return NextResponse.json({ error: "Sesi belum lengkap" }, { status: 400 });
  }

  const wedding = await prisma.wedding.findUnique({
    where: { id: session.weddingId },
    include: { package: true },
  });
  if (!wedding || !wedding.isActive) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }
  if (new Date() > wedding.accessExpiresAt) {
    return NextResponse.json({ error: "Masa akses booth ini sudah berakhir" }, { status: 410 });
  }

  const needsVoice = wedding.package.mediaMode === "PHOTO_AND_VOICE";
  if (needsVoice && !session.voiceNoteUrl) {
    return NextResponse.json({ error: "Pesan suara belum direkam" }, { status: 400 });
  }

  const submission = await prisma.guestSubmission.create({
    data: {
      weddingId: session.weddingId,
      frameId: session.frameId,
      guestName: session.guestName ?? null,
      mediaType: session.mediaType ?? "PHOTO",
      rawPhotoUrls: session.rawPhotoUrls ? JSON.stringify(session.rawPhotoUrls) : null,
      rawVideoUrl: session.rawVideoUrl ?? null,
      composedUrl: session.composedUrl,
      voiceNoteUrl: session.voiceNoteUrl ?? null,
      voiceDuration: session.voiceDuration ?? null,
    },
  });

  await clearWizardSession(token);

  return NextResponse.json({
    id: submission.id,
    composedUrl: submission.composedUrl,
    gallerySlug: wedding.gallerySlug,
  });
}

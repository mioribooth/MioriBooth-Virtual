import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWizardSession, patchWizardSession } from "@/lib/session";
import { buildComposedPhotoUrl, buildComposedVideoUrl, SlotPosition } from "@/lib/cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;

/** Ambil public_id dari secure_url Cloudinary (dipakai kalau client cuma kirim url). */
function publicIdFromUrl(url: string): string {
  const afterUpload = url.split("/upload/")[1] ?? url;
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[a-zA-Z0-9]+$/, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "token wajib diisi" }, { status: 400 });
  }

  const session = await getWizardSession(token);
  if (!session || !session.frameId) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 404 });
  }

  const frame = await prisma.frameTemplate.findUnique({ where: { id: session.frameId } });
  if (!frame) {
    return NextResponse.json({ error: "Frame tidak ditemukan" }, { status: 404 });
  }

  const slotPositions: SlotPosition[] = JSON.parse(frame.slotPositions);

  let composedUrl: string;

  if (frame.type === "PHOTO") {
    if (!session.rawPhotoUrls || session.rawPhotoUrls.length === 0) {
      return NextResponse.json({ error: "Belum ada foto tersimpan di sesi" }, { status: 400 });
    }
    const rawPublicIds = session.rawPhotoUrls.map(publicIdFromUrl);
    composedUrl = buildComposedPhotoUrl({
      cloudName: CLOUD_NAME,
      framePublicId: frame.overlayPublicId,
      frameWidth: frame.frameWidth,
      frameHeight: frame.frameHeight,
      rawPublicIds,
      slotPositions,
    });
  } else {
    if (!session.rawVideoUrl) {
      return NextResponse.json({ error: "Belum ada video tersimpan di sesi" }, { status: 400 });
    }
    composedUrl = buildComposedVideoUrl({
      cloudName: CLOUD_NAME,
      framePublicId: frame.overlayPublicId,
      rawVideoPublicId: publicIdFromUrl(session.rawVideoUrl),
    });
  }

  await patchWizardSession(token, { composedUrl, step: "composed" });

  return NextResponse.json({ composedUrl });
}

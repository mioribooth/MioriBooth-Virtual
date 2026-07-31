import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWizardSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const weddingId = body?.weddingId as string | undefined;

  if (!weddingId) {
    return NextResponse.json({ error: "weddingId wajib diisi" }, { status: 400 });
  }

  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding || !wedding.isActive) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }
  if (new Date() > wedding.accessExpiresAt) {
    return NextResponse.json({ error: "Masa akses booth ini sudah berakhir" }, { status: 410 });
  }

  const token = await createWizardSession(weddingId);
  return NextResponse.json({ token });
}

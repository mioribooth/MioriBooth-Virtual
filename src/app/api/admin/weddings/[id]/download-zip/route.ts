import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import archiver from "archiver";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

// Perlu Node runtime (bukan Edge) karena archiver pakai Node stream,
// dan ini bisa makan waktu cukup lama untuk wedding dengan banyak submission.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // detik — sesuaikan dengan limit plan hosting kamu

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "tamu";
}

function guessExtension(url: string, fallback: string): string {
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : fallback;
}

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
    include: { submissions: { orderBy: { createdAt: "asc" } } },
  });

  if (!wedding) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  if (wedding.submissions.length === 0) {
    return NextResponse.json({ error: "Belum ada submission untuk di-download" }, { status: 400 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });

  // Jalan di background: ambil tiap file dari Cloudinary lalu tambahkan ke archive.
  // Kegagalan satu file (mis. link kadaluarsa) tidak menggagalkan keseluruhan ZIP.
  (async () => {
    let i = 0;
    for (const s of wedding.submissions) {
      i += 1;
      const namePart = `${String(i).padStart(3, "0")}-${sanitizeFilename(s.guestName || "tamu")}`;

      try {
        const mediaRes = await fetch(s.composedUrl);
        if (mediaRes.ok && mediaRes.body) {
          const ext = guessExtension(s.composedUrl, s.mediaType === "VIDEO" ? "mp4" : "jpg");
          archive.append(Readable.fromWeb(mediaRes.body as any), {
            name: `${namePart}.${ext}`,
          });
        }
      } catch {
        // lewati file yang gagal diambil, lanjut ke berikutnya
      }

      if (s.voiceNoteUrl) {
        try {
          const voiceRes = await fetch(s.voiceNoteUrl);
          if (voiceRes.ok && voiceRes.body) {
            const ext = guessExtension(s.voiceNoteUrl, "mp3");
            archive.append(Readable.fromWeb(voiceRes.body as any), {
              name: `${namePart}-suara.${ext}`,
            });
          }
        } catch {
          // lewati kalau gagal
        }
      }
    }
    archive.finalize();
  })().catch(() => {
    archive.abort();
  });

  const zipFilename = `${sanitizeFilename(`${wedding.groomName}-${wedding.brideName}`)}-mioribooth.zip`;

  return new NextResponse(Readable.toWeb(archive) as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}

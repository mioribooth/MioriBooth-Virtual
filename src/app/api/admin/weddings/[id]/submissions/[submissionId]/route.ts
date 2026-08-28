import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";

/** Pastikan submission ini benar-benar milik wedding yang dimiliki vendor yang login. */
async function loadOwnedSubmission(vendorId: string, weddingId: string, submissionId: string) {
  return prisma.guestSubmission.findFirst({
    where: { id: submissionId, weddingId, wedding: { vendorId } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.isHidden !== "boolean") {
    return NextResponse.json({ error: "isHidden (boolean) wajib diisi" }, { status: 400 });
  }

  const existing = await loadOwnedSubmission(vendor.vendorId, params.id, params.submissionId);
  if (!existing) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  const updated = await prisma.guestSubmission.update({
    where: { id: existing.id },
    data: { isHidden: body.isHidden },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  const vendor = await getVendorFromCookies();
  if (!vendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await loadOwnedSubmission(vendor.vendorId, params.id, params.submissionId);
  if (!existing) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  await prisma.guestSubmission.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}

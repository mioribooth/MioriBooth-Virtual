import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const wedding = await prisma.wedding.findUnique({
    where: { slug: params.slug },
    select: { vendorId: true },
  });
  if (!wedding) {
    return NextResponse.json({ error: "Wedding tidak ditemukan" }, { status: 404 });
  }

  const filters = await prisma.colorFilter.findMany({
    where: { vendorId: wedding.vendorId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, lutFileUrl: true, lutSize: true },
  });

  return NextResponse.json({ filters });
}

import { NextRequest, NextResponse } from "next/server";
import { getWizardSession, patchWizardSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getWizardSession(params.token);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan atau kedaluwarsa" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const patch = await req.json().catch(() => null);
  if (!patch) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const updated = await patchWizardSession(params.token, patch);
  return NextResponse.json(updated);
}

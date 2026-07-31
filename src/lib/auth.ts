import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const VENDOR_COOKIE_NAME = "miori_vendor_session";

function getSecretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export interface VendorTokenPayload {
  vendorId: string;
  email: string;
}

export async function signVendorToken(payload: VendorTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyVendorToken(
  token: string
): Promise<VendorTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return { vendorId: payload.vendorId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

/** Dipakai di server components / route handlers untuk baca vendor yang login. */
export async function getVendorFromCookies(): Promise<VendorTokenPayload | null> {
  const token = cookies().get(VENDOR_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyVendorToken(token);
}

// Helper dipakai di semua halaman wizard tamu (client components) untuk baca/tulis
// token sesi yang disimpan di sessionStorage browser, dan memanggil API session.

export function getBoothToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`booth_token_${slug}`);
}

export async function patchSession(token: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/session/${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Sesi tidak valid, ulangi dari awal.");
  }
  return res.json();
}

export async function getSession(token: string) {
  const res = await fetch(`/api/session/${token}`);
  if (!res.ok) return null;
  return res.json();
}

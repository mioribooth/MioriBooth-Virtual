import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";

export default async function SubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const vendorToken = await getVendorFromCookies();
  if (!vendorToken) redirect("/dashboard/login");

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorToken.vendorId } });
  if (!vendor) redirect("/dashboard/login");

  const wedding = await prisma.wedding.findFirst({
    where: { id: params.id, vendorId: vendor.id },
    include: { submissions: { orderBy: { createdAt: "desc" } } },
  });

  if (!wedding) notFound();

  return (
    <div className="admin-shell">
      <AdminTopbar vendorName={vendor.name} />
      <div className="admin-container">
        <Link href={`/dashboard/booth-virtual/weddings/${wedding.id}`} className="muted">
          ← Kembali ke {wedding.groomName} &amp; {wedding.brideName}
        </Link>

        <h1 className="font-display" style={{ margin: "12px 0 20px" }}>
          Semua Submission ({wedding.submissions.length})
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
          {wedding.submissions.map((s) => (
            <div key={s.id} className="card">
              {s.mediaType === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.composedUrl}
                  alt={s.guestName ?? "Tamu"}
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={s.composedUrl}
                  controls
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }}
                />
              )}
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 14 }}>{s.guestName || "Tamu"}</strong>
                <p className="muted" style={{ fontSize: 12, margin: "4px 0" }}>
                  {new Date(s.createdAt).toLocaleString("id-ID")}
                </p>
                {s.voiceNoteUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio src={s.voiceNoteUrl} controls style={{ width: "100%", height: 32 }} />
                )}
              </div>
            </div>
          ))}
          {wedding.submissions.length === 0 && (
            <p className="muted">Belum ada submission dari tamu.</p>
          )}
        </div>
      </div>
    </div>
  );
}

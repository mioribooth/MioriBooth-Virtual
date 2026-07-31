import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";
import CopyLinkRow from "@/components/CopyLinkRow";
import DeleteWeddingButton from "@/components/DeleteWeddingButton";

export default async function WeddingDetailPage({
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
    include: {
      package: true,
      frames: { orderBy: { order: "asc" } },
      _count: { select: { submissions: true } },
    },
  });

  if (!wedding) notFound();

  const isExpired = new Date() > wedding.accessExpiresAt;
  const coupleName = `${wedding.groomName} & ${wedding.brideName}`;

  return (
    <div className="admin-shell">
      <AdminTopbar vendorName={vendor.name} />
      <div className="admin-container">
        <Link href="/dashboard/booth-virtual/weddings" className="muted">
          ← Semua wedding
        </Link>

        <div
          style={{
            marginTop: 12,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span className="eyebrow">{wedding.package.name} Package</span>
            <h1 className="font-display" style={{ margin: "4px 0" }}>
              {coupleName}
            </h1>
            <p className="muted">
              {new Date(wedding.eventDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              ·{" "}
              <span className={isExpired ? "badge badge-muted" : "badge"}>
                {isExpired
                  ? "Akses berakhir"
                  : `Akses sampai ${new Date(wedding.accessExpiresAt).toLocaleDateString("id-ID")}`}
              </span>
            </p>
          </div>
          <DeleteWeddingButton weddingId={wedding.id} coupleName={coupleName} />
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <CopyLinkRow label="Link Booth (share via QR code ke tamu)" path={`/w/${wedding.slug}`} />
          <CopyLinkRow label="Link Galeri (share ke pengantin)" path={`/gallery/${wedding.gallerySlug}`} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 className="font-display" style={{ fontSize: 22 }}>
            Frame ({wedding.frames.length})
          </h2>
          <Link
            href={`/dashboard/booth-virtual/weddings/${wedding.id}/frames/new`}
            className="btn btn-primary"
          >
            + Tambah Frame
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14, marginBottom: 30 }}>
          {wedding.frames.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/booth-virtual/weddings/${wedding.id}/frames/${f.id}/editor`}
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl ?? f.overlayImageUrl}
                alt={f.name}
                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
              />
              <strong style={{ fontSize: 14 }}>{f.name}</strong>
              <div>
                <span className="badge badge-muted">
                  {f.type === "PHOTO" ? `Foto · ${f.slotCount} slot` : "Video · 1 slot"}
                </span>
              </div>
            </Link>
          ))}
          {wedding.frames.length === 0 && (
            <p className="muted">Belum ada frame. Tambahkan frame pertama.</p>
          )}
        </div>

        <Link
          href={`/dashboard/booth-virtual/weddings/${wedding.id}/submissions`}
          className="btn btn-secondary"
        >
          Lihat Semua Submission ({wedding._count.submissions})
        </Link>
      </div>
    </div>
  );
}

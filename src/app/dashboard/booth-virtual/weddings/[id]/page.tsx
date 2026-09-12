import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";
import CopyLinkRow from "@/components/CopyLinkRow";
import DeleteWeddingButton from "@/components/DeleteWeddingButton";
import FrameGrid from "@/components/FrameGrid";
import BackButton from "@/components/BackButton";

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
        <BackButton href="/dashboard/booth-virtual/weddings" label="Semua wedding" />

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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={`/dashboard/booth-virtual/weddings/${wedding.id}/edit`}
              className="btn btn-ghost"
            >
              Edit Data
            </Link>
            <DeleteWeddingButton weddingId={wedding.id} coupleName={coupleName} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
            Data Client
          </span>
          <div className="client-data-grid">
            <div>
              <span className="client-data-label">Nomor WhatsApp</span>
              <span className="client-data-value">
                {wedding.clientPhone || <span className="muted">Belum diisi</span>}
              </span>
            </div>
            <div>
              <span className="client-data-label">Alamat / Venue</span>
              <span className="client-data-value">
                {wedding.clientAddress || <span className="muted">Belum diisi</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <CopyLinkRow label="Link Booth (share via QR code ke tamu)" path={`/w/${wedding.slug}`} />
          <CopyLinkRow label="Link Galeri (share ke pengantin)" path={`/gallery/${wedding.gallerySlug}`} />
          <CopyLinkRow
            label="Link Live Slideshow (buka di layar/proyektor venue)"
            path={`/gallery/${wedding.gallerySlug}/slideshow`}
          />
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

        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          Pakai tombol panah di tiap kartu buat atur urutan frame yang tamu lihat.
        </p>

        <FrameGrid
          weddingId={wedding.id}
          initialFrames={wedding.frames.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            slotCount: f.slotCount,
            previewUrl: f.previewUrl,
            overlayImageUrl: f.overlayImageUrl,
          }))}
        />

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

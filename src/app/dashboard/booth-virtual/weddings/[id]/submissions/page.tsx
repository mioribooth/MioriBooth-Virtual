import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";
import SubmissionCard from "@/components/SubmissionCard";
import BackButton from "@/components/BackButton";

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
        <BackButton
          href={`/dashboard/booth-virtual/weddings/${wedding.id}`}
          label={`Kembali ke ${wedding.groomName} & ${wedding.brideName}`}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "12px 0 8px" }}>
          <h1 className="font-display" style={{ margin: 0 }}>
            Semua Submission ({wedding.submissions.length})
          </h1>
          {wedding.submissions.length > 0 && (
            <a href={`/api/admin/weddings/${wedding.id}/download-zip`} className="btn btn-primary">
              Download Semua (ZIP)
            </a>
          )}
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Submission yang disembunyikan tidak akan tampil di galeri publik tamu, tapi tetap
          tersimpan di sini dan bisa ditampilkan lagi kapan saja.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
          {wedding.submissions.map((s) => (
            <SubmissionCard key={s.id} weddingId={wedding.id} submission={s} />
          ))}
          {wedding.submissions.length === 0 && (
            <p className="muted">Belum ada submission dari tamu.</p>
          )}
        </div>
      </div>
    </div>
  );
}

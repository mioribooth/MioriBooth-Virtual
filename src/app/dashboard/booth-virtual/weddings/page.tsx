import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";

function initials(groomName: string, brideName: string) {
  const a = groomName.trim().charAt(0).toUpperCase();
  const b = brideName.trim().charAt(0).toUpperCase();
  return `${a}${b}` || "MB";
}

export default async function WeddingsListPage() {
  const vendorToken = await getVendorFromCookies();
  if (!vendorToken) redirect("/dashboard/login");

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorToken.vendorId } });
  if (!vendor) redirect("/dashboard/login");

  const weddings = await prisma.wedding.findMany({
    where: { vendorId: vendor.id },
    include: { package: true, _count: { select: { submissions: true, frames: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const activeCount = weddings.filter((w) => now <= w.accessExpiresAt).length;
  const totalSubmissions = weddings.reduce((sum, w) => sum + w._count.submissions, 0);

  return (
    <div className="admin-shell">
      <AdminTopbar vendorName={vendor.name} />
      <div className="admin-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1 className="font-display" style={{ margin: "4px 0" }}>
              Wedding Events
            </h1>
          </div>
          <Link href="/dashboard/booth-virtual/weddings/new" className="btn btn-primary">
            + Wedding Baru
          </Link>
        </div>

        {weddings.length > 0 && (
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card-label">Total Wedding</span>
              <span className="stat-card-value">{weddings.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Akses Aktif</span>
              <span className="stat-card-value">{activeCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Akses Berakhir</span>
              <span className="stat-card-value">{weddings.length - activeCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Total Submission</span>
              <span className="stat-card-value">{totalSubmissions}</span>
            </div>
          </div>
        )}

        {weddings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="font-display">Belum ada wedding event</h2>
            <p className="muted" style={{ maxWidth: 360 }}>
              Klik &quot;Wedding Baru&quot; untuk mulai bikin booth virtual pertama kamu.
            </p>
            <Link
              href="/dashboard/booth-virtual/weddings/new"
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              + Wedding Baru
            </Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pengantin</th>
                <th>Tanggal</th>
                <th>Paket</th>
                <th>Frame</th>
                <th>Submission</th>
                <th>Status Akses</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {weddings.map((w) => {
                const isExpired = new Date() > w.accessExpiresAt;
                return (
                  <tr key={w.id}>
                    <td>
                      <div className="couple-cell">
                        <span className="couple-avatar">
                          {initials(w.groomName, w.brideName)}
                        </span>
                        <span className="couple-cell-names">
                          {w.groomName} &amp; {w.brideName}
                        </span>
                      </div>
                    </td>
                    <td>{new Date(w.eventDate).toLocaleDateString("id-ID")}</td>
                    <td>
                      <span className="badge">{w.package.name}</span>
                    </td>
                    <td>{w._count.frames}</td>
                    <td>{w._count.submissions}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          isExpired ? "status-pill-expired" : "status-pill-active"
                        }`}
                      >
                        {isExpired
                          ? "Berakhir"
                          : `Sampai ${new Date(w.accessExpiresAt).toLocaleDateString("id-ID")}`}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/booth-virtual/weddings/${w.id}`}
                        className="row-manage-link"
                      >
                        Kelola →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

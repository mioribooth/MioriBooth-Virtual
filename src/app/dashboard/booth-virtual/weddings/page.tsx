import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorFromCookies } from "@/lib/auth";
import AdminTopbar from "@/components/AdminTopbar";

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

  return (
    <div className="admin-shell">
      <AdminTopbar vendorName={vendor.name} />
      <div className="admin-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
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

        {weddings.length === 0 ? (
          <div className="card">
            <p className="muted">
              Belum ada wedding event. Klik &quot;Wedding Baru&quot; untuk mulai.
            </p>
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
                      {w.groomName} &amp; {w.brideName}
                    </td>
                    <td>{new Date(w.eventDate).toLocaleDateString("id-ID")}</td>
                    <td>
                      <span className="badge">{w.package.name}</span>
                    </td>
                    <td>{w._count.frames}</td>
                    <td>{w._count.submissions}</td>
                    <td>
                      <span className={isExpired ? "badge badge-muted" : "badge"}>
                        {isExpired
                          ? "Berakhir"
                          : `Sampai ${new Date(w.accessExpiresAt).toLocaleDateString("id-ID")}`}
                      </span>
                    </td>
                    <td>
                      <Link href={`/dashboard/booth-virtual/weddings/${w.id}`}>Kelola →</Link>
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

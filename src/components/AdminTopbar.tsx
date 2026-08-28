"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminTopbar({ vendorName }: { vendorName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  return (
    <div className="admin-topbar">
      <Link href="/dashboard/booth-virtual/weddings" className="font-display" style={{ fontSize: 20 }}>
        Miori Booth · Virtual Photobooth
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 14 }}>
        <span className="admin-vendor-avatar">{vendorName.charAt(0).toUpperCase()}</span>
        <span>{vendorName}</span>
        <button onClick={handleLogout} className="admin-logout-btn">
          Keluar
        </button>
      </div>
    </div>
  );
}

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
        <span>{vendorName}</span>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "white",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

// Homepage sengaja dimatikan (diganti halaman maintenance kosong) atas
// permintaan — landing page lamanya (dengan section harga, cara kerja, dll)
// masih disimpan utuh di /_backup-landing/ (di luar src/app biar gak ikut
// ke-build/ke-routing), tinggal restore ke sini kalau mau diaktifkan lagi.
import "./maintenance.css";

export const metadata = {
  title: "MioriBooth Virtual",
};

export default function MaintenancePage() {
  return (
    <div className="maintenance-shell">
      <div className="maintenance-card">
        <span className="maintenance-eyebrow">MioriBooth Virtual</span>
        <h1 className="font-display">Sedang dalam pemeliharaan</h1>
        <p className="muted">
          Halaman ini sementara tidak tersedia. Silakan kembali lagi nanti.
        </p>
      </div>
    </div>
  );
}

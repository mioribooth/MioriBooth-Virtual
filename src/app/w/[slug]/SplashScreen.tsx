"use client";

import { useEffect, useState } from "react";
import "./SplashScreen.css";

/**
 * Splash screen singkat pas masuk halaman utama — logo muncul dengan animasi
 * lalu fade out, baru konten aslinya (children, sudah ke-render di
 * belakangnya dari awal) kelihatan. Cuma jalan sekali per load halaman.
 */
export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1100);
    const hideTimer = setTimeout(() => setVisible(false), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div className={`splash-screen ${fading ? "is-fading" : ""}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white-2.png" alt="" className="splash-logo" />
        </div>
      )}
    </>
  );
}

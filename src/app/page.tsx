import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import FadeIn from "@/components/FadeIn";
import FrameMockup from "@/components/FrameMockup";
import TemplatePreviewCard from "@/components/TemplatePreviewCard";
import GalleryExampleCard from "@/components/GalleryExampleCard";
import "./landing.css";

// Kontak resmi MioriBooth Virtual
const WHATSAPP_NUMBER = "628134442375";
const WHATSAPP_MESSAGE = "Halo! Saya tertarik pakai MioriBooth Virtual untuk acara wedding saya.";
const INSTAGRAM_HANDLE = "mioribooth";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const steps = [
  {
    title: "Tamu Scan QR",
    body: "Setiap meja dapat kartu QR. Tamu tinggal scan pakai kamera HP, langsung buka booth virtual tanpa install apa pun.",
  },
  {
    title: "Rekam Kenangan",
    body: "Tamu ambil foto atau video di booth, lalu bisa tambahkan pesan suara dan nama pengirim untuk pengantin.",
  },
  {
    title: "Otomatis Dapat Frame",
    body: "Hasil foto/video langsung dibungkus frame khusus event kamu — siap di-download dan di-post ke story.",
  },
  {
    title: "Simpan & Tonton Bareng",
    body: "Tamu simpan hasilnya ke HP masing-masing, sementara semua kenangan juga tampil live di layar venue.",
  },
];

// "Kenapa memilih Miori Booth" — reasoning ala before/after, bukan cuma daftar fitur teknis
const whyChooseUs = [
  {
    label: "Satu",
    title: "Tanpa Sewa Alat Fisik",
    body: "Nggak perlu sewa unit kamera, operator, atau printer instan. Tamu pakai HP masing-masing — booth-nya ada di saku semua orang.",
  },
  {
    label: "Dua",
    title: "Semua Tamu Kebagian",
    body: "Karena setiap tamu buka dari HP sendiri-sendiri, puluhan orang bisa pakai bersamaan tanpa antre satu titik kamera.",
  },
  {
    label: "Tiga",
    title: "Kenangan Nggak Tercecer",
    body: "Foto, video, dan ucapan tamu otomatis terkumpul di satu galeri rapi milik pengantin — bukan tersebar di HP masing-masing tamu.",
  },
];

const venueTypes = [
  {
    title: "Resepsi Gedung",
    body: "Tamu tinggal scan QR di meja masing-masing, foto langsung masuk galeri tanpa perlu antre ke satu titik kamera.",
  },
  {
    title: "Garden & Outdoor Party",
    body: "Tidak perlu instalasi alat fisik atau listrik tambahan — cukup koneksi internet dan HP tamu masing-masing.",
  },
  {
    title: "Adat & Tradisional",
    body: "Frame dan warna bisa disesuaikan dengan tema budaya kalian, dari nuansa klasik sampai modern minimalis.",
  },
  {
    title: "Intimate Wedding",
    body: "Meski tamu terbatas, setiap ucapan dan momen tetap terekam rapi jadi kenang-kenangan digital.",
  },
];

const templates = [
  { title: "Satu Momen", subtitle: "1 foto — portrait", slots: 1 },
  { title: "Dua Sisi", subtitle: "2 foto — tumpuk", slots: 2 },
  { title: "Tiga Babak", subtitle: "3 foto — strip", slots: 3 },
  { title: "Empat Kenangan", subtitle: "4 foto — grid", slots: 4 },
];

const features = [
  {
    title: "Tanpa Antre, Tanpa Alat Fisik",
    body: "Tidak perlu sewa kamera atau printer instan. Tamu pakai HP masing-masing, booth bisa dipakai puluhan orang bersamaan.",
  },
  {
    title: "Frame Custom per Wedding",
    body: "Desain frame disesuaikan nama & tema pengantin, format pas untuk dibagikan ke Instagram/WhatsApp Story.",
  },
  {
    title: "Pesan Suara & Nama Pengirim",
    body: "Bukan cuma foto — tamu bisa tinggalkan ucapan suara, jadi kenangan yang lebih personal buat pengantin.",
  },
  {
    title: "Live Slideshow di Venue",
    body: "Semua kenangan tamu bisa ditampilkan otomatis di layar/proyektor venue, update real-time selama acara.",
  },
  {
    title: "Galeri Rapi untuk Pengantin",
    body: "Satu link galeri berisi semua foto, video, dan pesan suara tamu — bisa didownload sekaligus jadi satu file ZIP.",
  },
  {
    title: "Siap Dijual sebagai Paket",
    body: "Cocok buat vendor wedding organizer atau fotografer yang mau nambah layanan booth virtual ke paket jasa mereka.",
  },
];

// Placeholder ilustratif — BUKAN foto klien asli. Ganti dengan hasil nyata begitu tersedia.
const galleryExamples = [
  { names: "Nadia & Fajar", date: "14 . 06 . 2026" },
  { names: "Kevin & Sari", date: "22 . 07 . 2026" },
  { names: "Bagas & Wulan", date: "03 . 08 . 2026" },
  { names: "Intan & Reza", date: "19 . 09 . 2026" },
];

// Placeholder — contoh format testimoni. Ganti dengan kutipan asli dari klien (dengan izin) begitu tersedia.
const testimonials = [
  {
    initials: "N",
    name: "Contoh Pengantin",
    quote:
      "Tamu-tamu jadi lebih antusias foto sendiri lewat HP, hasilnya rapi masuk galeri tanpa kami harus kumpulin manual.",
  },
  {
    initials: "K",
    name: "Contoh Pengantin",
    quote:
      "Nggak perlu mikirin sewa alat tambahan — tinggal sebar QR code, tamu tinggal scan dan langsung bisa dipakai.",
  },
  {
    initials: "B",
    name: "Contoh Pengantin",
    quote: "Suka banget sama fitur pesan suara-nya, jadi kenangan yang lebih personal dari tamu.",
  },
];

export default async function LandingPage() {
  const packages = await prisma.boothPackage.findMany({
    orderBy: { price: "asc" },
  });

  return (
    <div className="landing-shell">
      <div className="landing-hero-dark">
        <header className="landing-nav">
          <Image
            src="/brand/logo-white.png"
            alt="MioriBooth"
            width={132}
            height={50}
            className="landing-logo-img"
            priority
          />
          <nav className="landing-nav-links">
            <a href="#cara-kerja">Cara Kerja</a>
            <a href="#kenapa-memilih">Kenapa Miori</a>
            <a href="#cocok-untuk">Cocok Untuk</a>
            <a href="#template">Template</a>
            <a href="#fitur">Fitur</a>
            <a href="#galeri">Galeri</a>
            <a href="#testimoni">Testimoni</a>
          </nav>
          <div className="landing-nav-actions">
            <a href={waLink(WHATSAPP_MESSAGE)} className="btn btn-primary" target="_blank" rel="noreferrer">
              Hubungi via WhatsApp
            </a>
            <Link href="/dashboard/login" className="landing-vendor-link">
              Login Vendor
            </Link>
          </div>
        </header>

        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="eyebrow">Photobooth Virtual untuk Wedding</span>
            <h1 className="font-display">
              Kenangan tamu undangan,
              <br />
              tanpa antre di depan kamera.
            </h1>
            <p className="muted landing-hero-sub">
              Tamu cukup scan QR di meja, ambil foto/video, tinggalkan pesan suara — langsung
              jadi konten bingkai cantik yang bisa mereka simpan dan bagikan. Semua kenangan
              tersimpan rapi untuk pengantin, bahkan bisa tampil live di layar venue.
            </p>
            <div className="landing-hero-actions">
              <a href={waLink(WHATSAPP_MESSAGE)} className="btn btn-primary" target="_blank" rel="noreferrer">
                Booking untuk Acara Saya
              </a>
              <a href="#cara-kerja" className="btn btn-secondary">
                Lihat Cara Kerjanya
              </a>
            </div>
          </div>

          <FrameMockup />
        </section>
      </div>

      <section id="cara-kerja" className="landing-section">
        <div className="landing-section-head">
          <span className="eyebrow">Cara Kerja</span>
          <h2 className="font-display">Empat langkah, tanpa ribet</h2>
        </div>
        <div className="landing-steps">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 90}>
              <div className="landing-step-card">
                <span className="landing-step-number">{i + 1}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="kenapa-memilih" className="landing-section landing-section-alt">
        <div className="landing-section-head">
          <span className="eyebrow">Kenapa Memilih MioriBooth</span>
          <h2 className="font-display">Alasan kenapa vendor & pengantin pilih kami</h2>
        </div>
        <div className="landing-problems-grid">
          {whyChooseUs.map((p, i) => (
            <FadeIn key={p.title} delay={i * 90}>
              <div className="landing-problem-card">
                <span className="landing-problem-label">{p.label}</span>
                <h3>{p.title}</h3>
                <p className="muted">{p.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="cocok-untuk" className="landing-section">
        <div className="landing-section-head">
          <span className="eyebrow">Cocok untuk Resepsi Seperti Apa</span>
          <h2 className="font-display">Apa pun konsep hari bahagia kalian</h2>
        </div>
        <div className="landing-venues">
          {venueTypes.map((v, i) => (
            <FadeIn key={v.title} delay={i * 80}>
              <div className="landing-venue-card">
                <h3>{v.title}</h3>
                <p className="muted">{v.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="template" className="landing-section landing-section-alt">
        <div className="landing-section-head">
          <span className="eyebrow">Preview Template</span>
          <h2 className="font-display">Empat gaya bingkai, satu nuansa elegan</h2>
          <p className="muted">
            Setiap template punya rasio & komposisi berbeda, tinggal sesuaikan dengan tema
            resepsi kalian.
          </p>
        </div>
        <div className="landing-templates">
          {templates.map((t, i) => (
            <FadeIn key={t.title} delay={i * 80}>
              <TemplatePreviewCard title={t.title} subtitle={t.subtitle} slots={t.slots} />
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="fitur" className="landing-section">
        <div className="landing-section-head">
          <span className="eyebrow">Fitur</span>
          <h2 className="font-display">Semua yang dibutuhkan acara wedding kamu</h2>
        </div>
        <div className="landing-features">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 70}>
              <div className="landing-feature-card">
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="galeri" className="landing-section landing-section-alt">
        <div className="landing-section-head">
          <span className="eyebrow">Galeri Hasil Foto</span>
          <h2 className="font-display">Kenangan yang tersusun rapi</h2>
          <p className="muted">Contoh ilustrasi tampilan frame — bukan hasil foto klien asli.</p>
        </div>
        <div className="landing-gallery-examples">
          {galleryExamples.map((g, i) => (
            <FadeIn key={g.names} delay={i * 80}>
              <GalleryExampleCard names={g.names} date={g.date} />
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="testimoni" className="landing-section">
        <div className="landing-section-head">
          <span className="eyebrow">Kata Pengantin</span>
          <h2 className="font-display">Contoh format testimoni klien</h2>
        </div>
        <div className="landing-testimonials">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name + i} delay={i * 90}>
              <div className="testimonial-card">
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{t.initials}</span>
                  <div>
                    <span className="testimonial-name">{t.name}</span>
                    <span className="testimonial-role">Pengantin</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <FadeIn>
        <section id="demo" className="landing-section landing-demo">
          <div className="landing-demo-card">
            <span className="eyebrow">Coba Demo</span>
            <h2 className="font-display">Belum yakin? Rasakan dulu sebelum booking</h2>
            <p className="muted">
              Chat kami dan minta sesi demo singkat — kami bantu tunjukkan alur booth, frame,
              sampai galeri dari sisi tamu maupun pengantin, sebelum kalian booking.
            </p>
            <a href={waLink("Halo! Saya mau coba demo MioriBooth Virtual sebelum booking.")} className="btn btn-primary" target="_blank" rel="noreferrer">
              Minta Demo via WhatsApp
            </a>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="landing-section landing-about">
          <div className="landing-about-card">
            <div className="landing-about-text">
              <span className="eyebrow">Tentang Kami</span>
              <h2 className="font-display">Bukan sekadar link, kami tim yang siap dihubungi</h2>
              <p className="muted">
                MioriBooth Virtual dijalankan langsung oleh tim kami — bukan layanan otomatis
                tanpa wajah. Ada pertanyaan soal paket, tanggal acara, atau mau lihat contoh hasil
                lebih dulu? Chat langsung saja, kami balas sendiri.
              </p>
            </div>
            <div className="landing-about-links">
              <a
                href={waLink(WHATSAPP_MESSAGE)}
                className="landing-contact-link"
                target="_blank"
                rel="noreferrer"
              >
                <span className="landing-contact-label">WhatsApp</span>
                <span className="landing-contact-value">0813-4444-2375</span>
              </a>
              <a
                href={INSTAGRAM_URL}
                className="landing-contact-link"
                target="_blank"
                rel="noreferrer"
              >
                <span className="landing-contact-label">Instagram</span>
                <span className="landing-contact-value">@{INSTAGRAM_HANDLE}</span>
              </a>
            </div>
          </div>
        </section>
      </FadeIn>

      {packages.length > 0 && (
        <section id="paket" className="landing-section">
          <div className="landing-section-head">
            <span className="eyebrow">Paket</span>
            <h2 className="font-display">Pilih paket sesuai kebutuhan acara</h2>
          </div>
          <div className="landing-pricing">
            {packages.map((pkg, i) => (
              <FadeIn key={pkg.id} delay={i * 100}>
                <div
                  className={`landing-price-card${i === 1 ? " landing-price-card-highlight" : ""}`}
                >
                  {i === 1 && <span className="landing-price-badge">Paling Populer</span>}
                  <h3 className="font-display">{pkg.name}</h3>
                  <p className="landing-price-amount">{formatRupiah(pkg.price)}</p>
                  <ul className="landing-price-list">
                    <li>
                      {pkg.mediaMode === "PHOTO_AND_VOICE"
                        ? "Foto/video + pesan suara"
                        : "Foto/video saja"}
                    </li>
                    <li>{pkg.includedFrameDesigns} desain frame custom</li>
                    <li>Galeri &amp; live slideshow aktif {pkg.accessDurationDays} hari</li>
                    <li>Download semua kenangan (ZIP)</li>
                  </ul>
                  <a
                    href={waLink(`Halo! Saya tertarik dengan paket ${pkg.name} MioriBooth Virtual.`)}
                    className="btn btn-primary btn-block"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pilih {pkg.name}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="muted landing-pricing-note">
            Harga dapat disesuaikan untuk kebutuhan khusus (jumlah tamu besar, multi-venue, atau
            tambahan desain frame). Hubungi kami untuk penawaran custom.
          </p>
        </section>
      )}

      <FadeIn>
        <section className="landing-cta">
          <h2 className="font-display">Siap bikin wedding kamu lebih berkesan?</h2>
          <p className="muted">
            Chat kami sekarang, ceritakan tanggal dan tema acara kamu — kami bantu siapkan booth
            virtualnya.
          </p>
          <a href={waLink(WHATSAPP_MESSAGE)} className="btn btn-primary" target="_blank" rel="noreferrer">
            Chat via WhatsApp
          </a>
        </section>
      </FadeIn>

      <footer className="landing-footer">
        <span className="font-display landing-footer-brand">MioriBooth Virtual</span>
        <div className="landing-footer-links">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="landing-vendor-link">
            @{INSTAGRAM_HANDLE}
          </a>
          <Link href="/dashboard/login" className="landing-vendor-link">
            Login Vendor
          </Link>
        </div>
      </footer>
    </div>
  );
}

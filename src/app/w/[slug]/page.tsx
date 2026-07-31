import { prisma } from "@/lib/prisma";
import StartBoothButton from "./StartBoothButton";
import "./landing.css";

export default async function LandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { slug: params.slug },
  });

  if (!wedding || !wedding.isActive) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <span className="eyebrow">Miori Booth</span>
          <h2>Halaman tidak ditemukan</h2>
          <p className="muted">Coba pindai ulang QR code yang tersedia di venue.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > wedding.accessExpiresAt;

  if (isExpired) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <span className="eyebrow">Miori Booth</span>
          <h2>Masa akses sudah berakhir</h2>
          <p className="muted">
            Terima kasih sudah menjadi bagian dari hari bahagia{" "}
            {wedding.groomName} &amp; {wedding.brideName}. Booth ini sudah tidak
            menerima kenangan baru.
          </p>
        </div>
      </div>
    );
  }

  const eventDateLabel = new Date(wedding.eventDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="booth-shell landing-shell">
      <div className="landing-cover">
        {wedding.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wedding.coverImageUrl} alt={`${wedding.groomName} & ${wedding.brideName}`} />
        ) : (
          <div className="landing-cover-placeholder" />
        )}
        <div className="landing-cover-fade" />
      </div>

      <div className="booth-content landing-content">
        <span className="eyebrow">Wedding Memories Of</span>
        <h1 className="font-display landing-title">
          {wedding.groomName}
          <span className="landing-amp">&amp;</span>
          {wedding.brideName}
        </h1>
        <p className="muted landing-date">{eventDateLabel}</p>

        <p className="muted landing-welcome">
          {wedding.welcomeText ??
            "Tinggalkan foto dan pesan suara terbaikmu untuk kami kenang selamanya."}
        </p>

        <StartBoothButton weddingId={wedding.id} slug={wedding.slug} />
      </div>
    </div>
  );
}

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export interface SlotPosition {
  x: number; // 0..1, relatif ke lebar frame
  y: number; // 0..1, relatif ke tinggi frame
  width: number; // 0..1
  height: number; // 0..1
}

/**
 * Bangun URL Cloudinary yang menempelkan 1..3 foto mentah ke posisi slot
 * yang ditentukan di Frame Editor, lalu menaruh gambar frame (border/desain)
 * di lapisan PALING ATAS supaya menutupi tepi foto.
 *
 * Penting soal urutan: base asset (segmen terakhir URL) dimuat sebagai kanvas
 * awal, lalu setiap transformasi sebelum-nya diterapkan berurutan dari kiri
 * ke kanan DI ATAS kanvas itu. Supaya border frame tetap di lapisan teratas,
 * base yang dipakai adalah frame itu sendiri (sekaligus menentukan ukuran
 * kanvas = frameWidth x frameHeight), lalu foto-foto tamu ditempel di atasnya
 * sesuai posisi slot, dan TERAKHIR frame yang sama ditempel ulang penuh di
 * lapisan paling atas — bagian transparannya membiarkan foto tetap terlihat,
 * bagian solid/border-nya menutupi tepi foto.
 */
export function buildComposedPhotoUrl(params: {
  cloudName: string;
  framePublicId: string;
  frameWidth: number;
  frameHeight: number;
  rawPublicIds: string[];
  slotPositions: SlotPosition[];
}): string {
  const { cloudName, framePublicId, frameWidth, frameHeight, rawPublicIds, slotPositions } =
    params;

  const encodedFrameId = framePublicId.replace(/\//g, ":");
  const layers: string[] = [];

  rawPublicIds.forEach((publicId, i) => {
    const slot = slotPositions[i];
    if (!slot) return;
    const w = Math.round(slot.width * frameWidth);
    const h = Math.round(slot.height * frameHeight);
    const x = Math.round(slot.x * frameWidth);
    const y = Math.round(slot.y * frameHeight);
    const encodedId = publicId.replace(/\//g, ":");
    layers.push(
      `l_${encodedId},w_${w},h_${h},c_fill,g_auto/fl_layer_apply,g_north_west,x_${x},y_${y}`
    );
  });

  // Lapisan terakhir: frame lagi, full-size, di atas semua foto.
  layers.push(`l_${encodedFrameId},w_${frameWidth},h_${frameHeight},c_fill/fl_layer_apply,g_center`);

  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const layerChain = layers.join("/");
  return `${base}/${layerChain}/${framePublicId}`;
}

/**
 * Versi video: 1 slot foto berupa video tamu, frame gambar (PNG) dioverlay
 * di atasnya. l_image: dipakai eksplisit karena base asset di sini adalah
 * video, jadi layer default perlu ditandai sebagai image, bukan video.
 */
export function buildComposedVideoUrl(params: {
  cloudName: string;
  framePublicId: string;
  rawVideoPublicId: string;
}): string {
  const { cloudName, framePublicId, rawVideoPublicId } = params;
  const encodedFrameId = framePublicId.replace(/\//g, ":");
  return `https://res.cloudinary.com/${cloudName}/video/upload/l_image:${encodedFrameId},fl_layer_apply,g_center/${rawVideoPublicId}.mp4`;
}

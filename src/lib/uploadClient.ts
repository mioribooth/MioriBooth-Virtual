// Dipakai di komponen client ("use client") untuk upload blob (foto/video/audio)
// langsung dari browser tamu ke Cloudinary, tanpa lewat server dulu (lebih cepat,
// dan gratis-tier friendly karena tidak membebani serverless function Vercel).

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  resource_type: string;
}

export async function uploadToCloudinary(
  blob: Blob,
  resourceType: "image" | "video",
  folder?: string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET belum diset di .env"
    );
  }

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", preset);
  if (folder) formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload Cloudinary gagal: ${text}`);
  }

  return res.json();
}

/**
 * Sama seperti uploadToCloudinary, tapi pakai XMLHttpRequest supaya bisa
 * dapat progress upload beneran (0-100%, berdasarkan berapa byte yang sudah
 * terkirim dari total ukuran file) — fetch() tidak punya event progress
 * untuk request body, jadi mesti pakai XHR untuk kasus ini (dipakai khusus
 * upload video yang cenderung berukuran besar & butuh waktu).
 */
export function uploadToCloudinaryWithProgress(
  blob: Blob,
  resourceType: "image" | "video",
  folder: string | undefined,
  onProgress: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET belum diset di .env"
      )
    );
  }

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", preset);
  if (folder) formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Gagal membaca respons upload"));
        }
      } else {
        reject(new Error(`Upload Cloudinary gagal: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload Cloudinary gagal: koneksi bermasalah"));
    xhr.send(formData);
  });
}

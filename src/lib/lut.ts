export interface ParsedLUT {
  size: number; // LUT_3D_SIZE
  data: Float32Array; // panjang size^3 * 3, urutan R paling cepat berubah lalu G lalu B, nilai 0-1
}

/**
 * Parse isi file .cube (format standar Adobe/DaVinci/dsb) jadi array data
 * 3D LUT. Baris komentar (#...) dan metadata selain LUT_3D_SIZE diabaikan.
 */
export function parseCubeLUT(text: string): ParsedLUT {
  const lines = text.split(/\r?\n/);
  let size = 0;
  const values: number[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("LUT_3D_SIZE")) {
      size = parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    // Baris metadata lain (TITLE, DOMAIN_MIN, DOMAIN_MAX, LUT_1D_SIZE dst) —
    // dilewati karena kita cuma dukung 3D LUT standar 0-1 domain.
    if (/^[A-Z_]+/.test(line)) continue;

    const parts = line.split(/\s+/).map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      values.push(parts[0], parts[1], parts[2]);
    }
  }

  if (!size || values.length !== size * size * size * 3) {
    throw new Error(
      `File .cube tidak valid (LUT_3D_SIZE=${size}, entri ditemukan=${values.length / 3})`
    );
  }

  return { size, data: Float32Array.from(values) };
}

function lutLookup(lut: ParsedLUT, ri: number, gi: number, bi: number): [number, number, number] {
  const s = lut.size;
  const idx = (bi * s * s + gi * s + ri) * 3;
  return [lut.data[idx], lut.data[idx + 1], lut.data[idx + 2]];
}

/**
 * Terapkan LUT ke satu ImageData secara in-place, pakai trilinear
 * interpolation (akurat) — dipakai buat FOTO (proses sekali, gapapa agak
 * lebih berat) dan buat bikin thumbnail preview tiap filter.
 */
export function applyLUTTrilinear(imageData: ImageData, lut: ParsedLUT): void {
  const { data } = imageData;
  const s = lut.size;
  const max = s - 1;

  for (let p = 0; p < data.length; p += 4) {
    const r = data[p] / 255;
    const g = data[p + 1] / 255;
    const b = data[p + 2] / 255;

    const rf = r * max;
    const gf = g * max;
    const bf = b * max;

    const r0 = Math.floor(rf);
    const g0 = Math.floor(gf);
    const b0 = Math.floor(bf);
    const r1 = Math.min(r0 + 1, max);
    const g1 = Math.min(g0 + 1, max);
    const b1 = Math.min(b0 + 1, max);

    const rd = rf - r0;
    const gd = gf - g0;
    const bd = bf - b0;

    const c000 = lutLookup(lut, r0, g0, b0);
    const c100 = lutLookup(lut, r1, g0, b0);
    const c010 = lutLookup(lut, r0, g1, b0);
    const c110 = lutLookup(lut, r1, g1, b0);
    const c001 = lutLookup(lut, r0, g0, b1);
    const c101 = lutLookup(lut, r1, g0, b1);
    const c011 = lutLookup(lut, r0, g1, b1);
    const c111 = lutLookup(lut, r1, g1, b1);

    for (let ch = 0; ch < 3; ch++) {
      const c00 = c000[ch] * (1 - rd) + c100[ch] * rd;
      const c10 = c010[ch] * (1 - rd) + c110[ch] * rd;
      const c01 = c001[ch] * (1 - rd) + c101[ch] * rd;
      const c11 = c011[ch] * (1 - rd) + c111[ch] * rd;
      const c0 = c00 * (1 - gd) + c10 * gd;
      const c1 = c01 * (1 - gd) + c11 * gd;
      const c = c0 * (1 - bd) + c1 * bd;
      data[p + ch] = Math.round(Math.min(1, Math.max(0, c)) * 255);
    }
  }
}

/**
 * Versi nearest-neighbor (bukan interpolasi) — jauh lebih murah secara
 * komputasi, dipakai buat VIDEO yang harus diproses frame-by-frame (puluhan
 * ribu piksel dikali ratusan frame). Sedikit lebih kasar dari trilinear tapi
 * bedanya nyaris gak kelihatan di video (apalagi habis dikompres jadi
 * mp4/webm), dan tetap LUT asli — bukan kira-kira/approksimasi warna.
 */
export function applyLUTNearest(imageData: ImageData, lut: ParsedLUT): void {
  const { data } = imageData;
  const s = lut.size;
  const max = s - 1;

  for (let p = 0; p < data.length; p += 4) {
    const ri = Math.round((data[p] / 255) * max);
    const gi = Math.round((data[p + 1] / 255) * max);
    const bi = Math.round((data[p + 2] / 255) * max);
    const [r, g, b] = lutLookup(lut, ri, gi, bi);
    data[p] = Math.round(Math.min(1, Math.max(0, r)) * 255);
    data[p + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
    data[p + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
  }
}

/** Load gambar dari URL (dengan CORS) jadi HTMLImageElement siap dipakai canvas. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = url;
  });
}

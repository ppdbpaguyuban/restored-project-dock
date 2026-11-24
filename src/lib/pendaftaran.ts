// Nomor pendaftaran dibuat di perangkat calon siswa, karena formulir publik tidak bisa membaca balik baris yang baru disimpan.
const HURUF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I agar tidak tertukar saat dibacakan

/** Contoh: tahun "2027/2028", kode "RPL" → "PPDB-2728-RPL-7KQ4XM". */
export function buatNoDaftar(tahunAjaran: string, kodeJurusan: string, acak: () => number = Math.random): string {
  const th = (tahunAjaran.match(/\d{4}/g) ?? []).map((y) => y.slice(2)).join("") || "0000";
  const kode = Array.from({ length: 6 }, () => HURUF[Math.floor(acak() * HURUF.length) % HURUF.length]).join("");
  return `PPDB-${th}-${kodeJurusan || "UMUM"}-${kode}`;
}

/** Kolom nomor pendaftaran belum dibuat di database (SQL belum dijalankan). */
export const kolomNoDaftarBelumAda = (m: string) => /no_daftar/i.test(m) && /column|schema cache|does not exist/i.test(m);

/** Pesan untuk calon siswa saat pendaftaran gagal disimpan. NISN ganda dikenali dari indeks unik (nisn, tahun_ajaran). */
export function pesanGagalKirim(e: unknown): string {
  const g = (e ?? {}) as { code?: unknown; message?: unknown; details?: unknown };
  const teks = `${String(g.message ?? "")} ${String(g.details ?? "")}`.toLowerCase();
  return g.code === "23505" && teks.includes("nisn") ? "NISN sudah terdaftar" : "Gagal mengirim, coba lagi.";
}

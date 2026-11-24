export type Row = Record<string, unknown> & { id: string; nama: string; nisn: string; no_hp: string; tahun_ajaran: string | null };
export const DOC_KEYS = ["foto", "kk", "akta", "skl"] as const;
/** Semua berkas yang bisa diunggah calon siswa (KIP opsional, tidak dihitung sebagai berkas kurang). */
export const DOC_TAMPIL = [...DOC_KEYS, "kip"] as const;
export const NISN_URL = "https://nisn.data.kemdikbud.go.id/";

export function noWa(hp: string) {
  const d = (hp ?? "").replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
}
export function hpValid(hp: string) {
  const d = (hp ?? "").replace(/\D/g, "");
  if (!/^(08|628)\d{8,11}$/.test(d)) return false;
  return !/(\d)\1{6,}/.test(d) && !d.includes("1234567890");
}
export function usia(tgl: string | null | undefined, now = new Date()) {
  if (!tgl) return null;
  const t = new Date(tgl);
  if (isNaN(t.getTime())) return null;
  let u = now.getFullYear() - t.getFullYear();
  if (now.getMonth() < t.getMonth() || (now.getMonth() === t.getMonth() && now.getDate() < t.getDate())) u--;
  return u;
}

export type Level = "siap" | "perhatian" | "fiktif";
/** Pemeriksaan otomatis: daftar peringatan + tingkat badge. */
export function cekOtomatis(r: Row, semua: Row[], wajibBerkas = true, now = new Date()) {
  const w: string[] = [];
  let fatal = false;
  if (!/^\d{10}$/.test(r.nisn ?? "")) { w.push("NISN bukan 10 angka"); fatal = true; }
  if (semua.some((x) => x.id !== r.id && x.nisn === r.nisn && x.tahun_ajaran === r.tahun_ajaran)) { w.push("NISN terdaftar ganda"); fatal = true; }
  if (!hpValid(r.no_hp)) { w.push("Nomor HP tidak wajar"); fatal = true; }
  const u = usia(r["tanggal_lahir"] as string | null, now);
  if (u === null || u < 13 || u > 21) w.push(u === null ? "Tanggal lahir kosong" : `Usia tidak lazim (${u} th)`);
  if (wajibBerkas) {
    const kurang = DOC_KEYS.filter((k) => !r[`berkas_${k}`]);
    if (kurang.length) w.push("Berkas kurang: " + kurang.join(", ").toUpperCase());
  }
  if (String(r.nama ?? "").trim().length < 3 || /^(test|tes|coba|asd)/i.test(String(r.nama ?? ""))) { w.push("Nama mencurigakan"); fatal = true; }
  const level: Level = fatal ? "fiktif" : w.length ? "perhatian" : "siap";
  return { level, peringatan: w };
}

export const TEMPLATE_WA = {
  lengkap: (n: string) => `Assalamu'alaikum, ${n}. Berkas pendaftaran PPDB SMK Muhammadiyah 1 Paguyangan Anda sudah kami terima dan dinyatakan LENGKAP. Silakan pantau informasi selanjutnya. Terima kasih.`,
  perbaikan: (n: string, catatan: string) => `Assalamu'alaikum, ${n}. Berkas PPDB SMK Muhammadiyah 1 Paguyangan Anda perlu diperbaiki${catatan ? ": " + catatan : "."} Mohon segera kirim ulang. Terima kasih.`,
  diterima: (n: string, j: string) => `Assalamu'alaikum, ${n}. Selamat! Anda DITERIMA di SMK Muhammadiyah 1 Paguyangan jurusan ${j}. Informasi daftar ulang akan kami sampaikan. Terima kasih.`,
};
export const waLink = (hp: string, teks: string) => `https://wa.me/${noWa(hp)}?text=${encodeURIComponent(teks)}`;

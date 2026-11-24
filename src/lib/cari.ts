// Pencarian per kategori & pengurutan daftar pendaftar di panel Admin.
import { CEK_VERIFIKASI } from "@/lib/lacak";

export type BarisCari = Record<string, unknown> & { nama?: string | null; created_at?: string | null };

export const KATEGORI_CARI = [
  { k: "semua", l: "Semua data", ph: "Cari nama, no. daftar, NISN, sekolah, HP" },
  { k: "nama", l: "Nama siswa", ph: "Ketik nama calon siswa" },
  { k: "no_daftar", l: "No. pendaftaran", ph: "Contoh: PPDB-2728-RPL" },
  { k: "nisn", l: "NISN", ph: "10 angka NISN" },
  { k: "asal_sekolah", l: "Asal sekolah", ph: "Nama SMP / MTs" },
  { k: "no_hp", l: "No. WhatsApp / HP", ph: "Contoh: 0812…" },
] as const;
export type KategoriCari = (typeof KATEGORI_CARI)[number]["k"];

export const URUTAN = [
  { k: "baru", l: "Terbaru daftar" },
  { k: "lama", l: "Terlama daftar" },
  { k: "nama_az", l: "Nama A → Z" },
  { k: "nama_za", l: "Nama Z → A" },
  { k: "no_daftar", l: "No. pendaftaran" },
  { k: "sekolah", l: "Asal sekolah A → Z" },
  { k: "cek_sedikit", l: "Checklist paling sedikit" },
  { k: "cek_banyak", l: "Checklist paling lengkap" },
] as const;
export type Urutan = (typeof URUTAN)[number]["k"];

const teks = (v: unknown) => (v == null ? "" : String(v)).toLowerCase();
const angka = (v: unknown) => teks(v).replace(/\D/g, "");
/** 08xx dan 628xx dianggap sama. */
const hpNormal = (v: unknown) => { const d = angka(v); return d.startsWith("62") ? "0" + d.slice(2) : d; };

export function cocokCari(r: BarisCari, q: string, kat: KategoriCari = "semua"): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hp = () => { const d = hpNormal(s); return d.length > 0 && hpNormal(r["no_hp"]).includes(d); };
  switch (kat) {
    case "nama": return teks(r.nama).includes(s);
    case "no_daftar": return teks(r["no_daftar"]).replace(/\s/g, "").includes(s.replace(/\s/g, ""));
    case "nisn": return angka(r["nisn"]).includes(angka(s) || s);
    case "asal_sekolah": return teks(r["asal_sekolah"]).includes(s);
    case "no_hp": return hp();
    default:
      return ["nama", "no_daftar", "nisn", "asal_sekolah", "no_hp"].some((k) => teks(r[k]).includes(s)) || (/\d{4,}/.test(s) && hp());
  }
}

export const jumlahCek = (r: BarisCari, cek: readonly string[] = CEK_VERIFIKASI) => {
  const v = (r["verifikasi"] ?? {}) as Record<string, boolean>;
  return cek.filter((c) => v[c]).length;
};

const banding = (a: string, b: string) => a.localeCompare(b, "id", { sensitivity: "base", numeric: true });
const waktu = (r: BarisCari) => { const t = Date.parse(String(r.created_at ?? "")); return isNaN(t) ? 0 : t; };

export function urutkan<T extends BarisCari>(rows: T[], u: Urutan = "baru", cek: readonly string[] = CEK_VERIFIKASI): T[] {
  const kosongAkhir = (a: string, b: string) => (!a && b ? 1 : a && !b ? -1 : banding(a, b));
  const f: Record<Urutan, (a: T, b: T) => number> = {
    baru: (a, b) => waktu(b) - waktu(a),
    lama: (a, b) => waktu(a) - waktu(b),
    nama_az: (a, b) => banding(String(a.nama ?? ""), String(b.nama ?? "")),
    nama_za: (a, b) => banding(String(b.nama ?? ""), String(a.nama ?? "")),
    no_daftar: (a, b) => kosongAkhir(String(a["no_daftar"] ?? ""), String(b["no_daftar"] ?? "")),
    sekolah: (a, b) => kosongAkhir(String(a["asal_sekolah"] ?? "").trim(), String(b["asal_sekolah"] ?? "").trim()) || banding(String(a.nama ?? ""), String(b.nama ?? "")),
    cek_sedikit: (a, b) => jumlahCek(a, cek) - jumlahCek(b, cek) || waktu(a) - waktu(b),
    cek_banyak: (a, b) => jumlahCek(b, cek) - jumlahCek(a, cek) || waktu(a) - waktu(b),
  };
  return [...rows].sort(f[u] ?? f.baru);
}

import { CEK_VERIFIKASI } from "@/lib/lacak";

export const JURUSAN_PPDB = [
  { k: "TKR", n: "Teknik Kendaraan Ringan" },
  { k: "TSM", n: "Teknik Sepeda Motor" },
  { k: "TOTR", n: "Teknik Ototronik" },
  { k: "RPL", n: "Rekayasa Perangkat Lunak" },
  { k: "BDF", n: "Broadcasting dan Perfilman" },
] as const;

export type BarisRekap = { status?: string | null; jurusan?: string | null; verifikasi?: Record<string, boolean> | null };
export type RekapJurusan = {
  jurusan: string; kode: string; total: number;
  baru: number; diverifikasi: number; diterima: number; ditolak: number;
  /** Semua butir checklist verifikasi sudah dicentang. */
  lengkap: number;
  /** Checklist belum lengkap (perlu diisi panitia). */
  perluCek: number;
};

export const checklistLengkap = (r: BarisRekap, cek: readonly string[] = CEK_VERIFIKASI) => cek.every((c) => r.verifikasi?.[c]);

/** Rekap jumlah pendaftar per jurusan. Semua jurusan sekolah selalu muncul (meski 0), jurusan lain di belakang. */
export function rekapJurusan(rows: BarisRekap[], cek: readonly string[] = CEK_VERIFIKASI): RekapJurusan[] {
  const peta = new Map<string, RekapJurusan>();
  const baru = (jurusan: string, kode: string): RekapJurusan => ({ jurusan, kode, total: 0, baru: 0, diverifikasi: 0, diterima: 0, ditolak: 0, lengkap: 0, perluCek: 0 });
  for (const j of JURUSAN_PPDB) peta.set(j.n, baru(j.n, j.k));
  for (const r of rows) {
    const nama = r.jurusan?.trim() || "Tanpa jurusan";
    const x = peta.get(nama) ?? baru(nama, nama === "Tanpa jurusan" ? "-" : nama.slice(0, 4).toUpperCase());
    peta.set(nama, x);
    x.total++;
    const st = r.status ?? "baru";
    if (st === "baru" || st === "diverifikasi" || st === "diterima" || st === "ditolak") x[st]++;
    if (checklistLengkap(r, cek)) x.lengkap++; else x.perluCek++;
  }
  return [...peta.values()];
}

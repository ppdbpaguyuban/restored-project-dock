import { statusGelombang, type Gelombang } from "@/lib/tahun";

export type Kolom = { k: string; label: string };
export const KOLOM: Kolom[] = [
  { k: "no_daftar", label: "No. Daftar" }, { k: "nama", label: "Nama" }, { k: "nisn", label: "NISN" },
  { k: "tanggal_lahir", label: "Tgl Lahir" }, { k: "jenis_kelamin", label: "Jenis Kelamin" }, { k: "agama", label: "Agama" },
  { k: "asal_sekolah", label: "Asal Sekolah" }, { k: "kota_sekolah", label: "Kota Sekolah" }, { k: "tahun_lulus", label: "Tahun Lulus" },
  { k: "jurusan", label: "Jurusan" }, { k: "jurusan_2", label: "Jurusan Pilihan 2" },
  { k: "no_hp", label: "No. HP" }, { k: "alamat", label: "Alamat" }, { k: "gelombang", label: "Gelombang" },
  { k: "tahun_ajaran", label: "Tahun Ajaran" }, { k: "status", label: "Status" }, { k: "petugas", label: "Petugas" },
  { k: "catatan", label: "Catatan" }, { k: "created_at", label: "Tgl Daftar" },
];
export const KOLOM_AWAL = ["no_daftar", "nama", "nisn", "asal_sekolah", "jurusan", "no_hp", "gelombang", "status"];

/** Laporan sementara selama gelombang terkait belum selesai/ditutup. Tanpa data gelombang = sementara. */
export function laporanSementara(list: Gelombang[], gel: string): boolean {
  const pakai = gel && gel !== "-" ? list.filter((g) => g.nama === gel) : list;
  if (!pakai.length) return true;
  return pakai.some((g) => { const s = statusGelombang(g); return s === "akan" || s === "dibuka"; });
}

export const pindah = <T,>(a: T[], i: number, d: number): T[] => {
  const j = i + d; if (j < 0 || j >= a.length) return a;
  const b = [...a]; [b[i], b[j]] = [b[j] as T, b[i] as T]; return b;
};

// Aturan formulir pendaftaran 4 tahap: data yang wajib diisi per tahap dan pesan galatnya.
export type DataPendaftar = {
  nama: string;
  nisn: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  no_hp: string;
  alamat: string;
  asal_sekolah: string;
  kota_sekolah: string;
  tahun_lulus: string;
  jurusan: string;
  jurusan_2: string;
};

export const DATA_KOSONG: DataPendaftar = {
  nama: "", nisn: "", tanggal_lahir: "", jenis_kelamin: "", agama: "", no_hp: "", alamat: "",
  asal_sekolah: "", kota_sekolah: "", tahun_lulus: "", jurusan: "", jurusan_2: "",
};

export const BERKAS = [
  { k: "foto", label: "Pas Foto 3x4", wajib: true, accept: "image/*" },
  { k: "kk", label: "Kartu Keluarga", wajib: false, accept: "image/*,application/pdf" },
  { k: "akta", label: "Akta Kelahiran", wajib: false, accept: "image/*,application/pdf" },
  { k: "skl", label: "SKL / Rapor", wajib: false, accept: "image/*,application/pdf" },
  { k: "kip", label: "KIP / KKS / PKH", wajib: false, accept: "image/*,application/pdf" },
] as const;
export type KunciBerkas = (typeof BERKAS)[number]["k"];
export const MAKS_BERKAS = 4 * 1024 * 1024;

export const JUMLAH_TAHAP = 4;
export type Galat = Partial<Record<keyof DataPendaftar | KunciBerkas, string>>;

/** Kembalikan galat untuk tahap 1–3 (kosong = boleh lanjut). Tahap 4 memeriksa semuanya. */
export function validasiTahap(tahap: number, d: DataPendaftar, berkas: Partial<Record<KunciBerkas, unknown>>, wajibBerkas = true): Galat {
  const g: Galat = {};
  if (tahap === 1 || tahap === 4) {
    if (!d.nama.trim()) g.nama = "Nama lengkap wajib diisi.";
    if (!d.nisn.trim()) g.nisn = "NISN wajib diisi.";
    else if (!/^\d{10}$/.test(d.nisn.trim())) g.nisn = "NISN harus 10 digit angka.";
    if (!d.tanggal_lahir) g.tanggal_lahir = "Tanggal lahir wajib diisi.";
    if (!d.no_hp.trim()) g.no_hp = "Nomor HP wajib diisi.";
    else if (!/^[+\d\s()-]+$/.test(d.no_hp.trim()) || d.no_hp.replace(/\D/g, "").length < 8) g.no_hp = "Nomor HP hanya angka, minimal 8 digit.";
  }
  if (tahap === 2 || tahap === 4) {
    if (!d.asal_sekolah.trim()) g.asal_sekolah = "Nama sekolah asal wajib diisi.";
    if (!d.jurusan) g.jurusan = "Pilih jurusan pilihan 1.";
  }
  if (tahap === 3 || tahap === 4) {
    if (wajibBerkas && !berkas.foto) g.foto = "Pas foto 3x4 wajib diunggah.";
  }
  return g;
}

/** Nama kolom yang belum ada di database menurut pesan galat penyimpanan, bila ada. */
export const kolomTakDikenal = (m: string): string | null =>
  m.match(/could not find the '([^']+)' column/i)?.[1] ?? m.match(/column "?([a-z0-9_]+)"? (?:of relation \S+ )?does not exist/i)?.[1] ?? null;

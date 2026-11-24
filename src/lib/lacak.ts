// Pelacakan status pendaftaran oleh calon siswa (tanpa login).
// Data hanya dibaca lewat fungsi database `lacak_pendaftaran`, yang mewajibkan nomor pendaftaran + tanggal lahir yang cocok.

/** Butir checklist verifikasi yang dicentang petugas di halaman admin. */
export const CEK_VERIFIKASI = ["Pas Foto", "Kartu Keluarga", "Akta Kelahiran", "SKL / Rapor", "Data diri sesuai"] as const;

export type HasilLacak = {
  no_daftar: string;
  nama: string;
  jurusan: string;
  gelombang: string | null;
  tahun_ajaran: string | null;
  status: string | null;
  verifikasi: Record<string, boolean> | null;
  didaftar_at: string | null;
  diverifikasi_at: string | null;
  daftar_ulang?: import("./daftar-ulang").DaftarUlang | null;
};

export type Keadaan = "selesai" | "berjalan" | "menunggu" | "gagal";
export type Tahap = { judul: string; ket: string; keadaan: Keadaan; tanggal?: string | null };

/** Rapikan ketikan: huruf besar, tanpa spasi, tanda pisah seragam. */
export const rapikanNo = (s: string) => s.toUpperCase().replace(/[\s]+/g, "").replace(/[–—_]/g, "-");
export const formatNoValid = (s: string) => /^PPDB-\d{4}-[A-Z]{2,6}-[A-Z0-9]{6}$/.test(rapikanNo(s));

export const jumlahTercentang = (v: Record<string, boolean> | null | undefined) => CEK_VERIFIKASI.filter((c) => v?.[c]).length;

const SELESAI_VERIF = ["diverifikasi", "diterima", "ditolak"];

export function tahapan(h: HasilLacak): Tahap[] {
  const st = h.status ?? "baru";
  const n = jumlahTercentang(h.verifikasi);
  const total = CEK_VERIFIKASI.length;
  const verifSelesai = SELESAI_VERIF.includes(st);
  const berkas: Tahap = verifSelesai || n === total
    ? { judul: "Pemeriksaan berkas", ket: `${total} dari ${total} butir sudah diperiksa.`, keadaan: "selesai" }
    : n > 0
      ? { judul: "Pemeriksaan berkas", ket: `${n} dari ${total} butir sudah diperiksa panitia.`, keadaan: "berjalan" }
      : { judul: "Pemeriksaan berkas", ket: "Menunggu giliran diperiksa panitia.", keadaan: "berjalan" };
  return [
    { judul: "Pendaftaran diterima", ket: "Data Anda sudah tersimpan di sistem PPDB.", keadaan: "selesai", tanggal: h.didaftar_at },
    berkas,
    verifSelesai
      ? { judul: "Verifikasi selesai", ket: "Berkas dan data diri dinyatakan lengkap.", keadaan: "selesai", tanggal: h.diverifikasi_at }
      : { judul: "Verifikasi", ket: "Dinyatakan selesai setelah semua butir diperiksa.", keadaan: "menunggu" },
    st === "diterima"
      ? { judul: "Hasil seleksi", ket: "Selamat, Anda DITERIMA. Ikuti informasi daftar ulang dari panitia.", keadaan: "selesai" }
      : st === "ditolak"
        ? { judul: "Hasil seleksi", ket: "Mohon maaf, Anda belum diterima. Hubungi panitia untuk informasi lebih lanjut.", keadaan: "gagal" }
        : { judul: "Hasil seleksi", ket: "Diumumkan panitia sesuai jadwal pendaftaran.", keadaan: "menunggu" },
  ];
}

export const LABEL_STATUS: Record<string, string> = {
  baru: "Sedang diperiksa",
  diverifikasi: "Berkas terverifikasi",
  diterima: "Diterima",
  ditolak: "Belum diterima",
};

/** Fungsi pelacakan belum dibuat di database (SQL belum dijalankan). */
export const fungsiLacakBelumAda = (m: string) => /lacak_pendaftaran/i.test(m) || /PGRST202|could not find the function/i.test(m);

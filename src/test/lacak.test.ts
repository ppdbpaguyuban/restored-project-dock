import { describe, expect, it } from "vitest";
import { formatNoValid, rapikanNo, tahapan, type HasilLacak } from "@/lib/lacak";

const dasar: HasilLacak = { no_daftar: "PPDB-2728-RPL-7KQ4XM", nama: "Budi", jurusan: "Rekayasa Perangkat Lunak", gelombang: null, tahun_ajaran: "2027/2028", status: "baru", verifikasi: {}, didaftar_at: "2027-11-01T00:00:00Z", diverifikasi_at: null };
const keadaan = (h: HasilLacak) => tahapan(h).map((t) => t.keadaan);

describe("pelacakan status pendaftaran", () => {
  it("nomor ketikan huruf kecil/berspasi tetap dikenali", () => {
    expect(rapikanNo(" ppdb-2728-rpl-7kq4xm ")).toBe("PPDB-2728-RPL-7KQ4XM");
    expect(formatNoValid("ppdb-2728-rpl-7kq4xm")).toBe(true);
    expect(formatNoValid("12345")).toBe(false);
  });
  it("baru terdaftar: berkas menunggu diperiksa, verifikasi & hasil belum", () => {
    expect(keadaan(dasar)).toEqual(["selesai", "berjalan", "menunggu", "menunggu"]);
  });
  it("3 dari 5 butir dicentang petugas ditampilkan sebagai progres", () => {
    const t = tahapan({ ...dasar, verifikasi: { "Pas Foto": true, "Kartu Keluarga": true, "Akta Kelahiran": true } });
    expect(t[1]?.ket).toBe("3 dari 5 butir sudah diperiksa panitia.");
  });
  it("status diverifikasi: berkas dan verifikasi selesai, hasil masih menunggu", () => {
    expect(keadaan({ ...dasar, status: "diverifikasi" })).toEqual(["selesai", "selesai", "selesai", "menunggu"]);
  });
  it("diterima menutup semua tahap; ditolak menandai hasil gagal", () => {
    expect(keadaan({ ...dasar, status: "diterima" })).toEqual(["selesai", "selesai", "selesai", "selesai"]);
    expect(keadaan({ ...dasar, status: "ditolak" })[3]).toBe("gagal");
  });
});

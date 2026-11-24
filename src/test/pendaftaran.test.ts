import { describe, expect, it } from "vitest";
import { buatNoDaftar, pesanGagalKirim } from "@/lib/pendaftaran";

describe("nomor pendaftaran", () => {
  it("memuat tahun ajaran singkat dan kode jurusan", () => expect(buatNoDaftar("2027/2028", "RPL", () => 0)).toBe("PPDB-2728-RPL-AAAAAA"));
  it("bagian acak 6 karakter tanpa huruf/angka yang mudah tertukar", () => {
    const no = buatNoDaftar("2027/2028", "TKR");
    expect(no).toMatch(/^PPDB-2728-TKR-[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("pesan gagal kirim", () => {
  it("NISN ganda", () => expect(pesanGagalKirim({ code: "23505", message: 'duplicate key value violates unique constraint "pendaftar_nisn_ta_key"' })).toBe("NISN sudah terdaftar"));
  it("nomor pendaftaran ganda bukan NISN", () => expect(pesanGagalKirim({ code: "23505", message: 'duplicate key value violates unique constraint "pendaftar_no_daftar_key"' })).toBe("Gagal mengirim, coba lagi."));
  it("koneksi putus", () => expect(pesanGagalKirim(new TypeError("Failed to fetch"))).toBe("Gagal mengirim, coba lagi."));
});

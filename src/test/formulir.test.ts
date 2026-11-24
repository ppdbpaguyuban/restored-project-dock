import { describe, expect, it } from "vitest";
import { DATA_KOSONG, kolomTakDikenal, validasiTahap } from "@/lib/formulir";

const lengkap1 = { ...DATA_KOSONG, nama: "Budi", nisn: "0012345678", tanggal_lahir: "2011-01-02", no_hp: "081234567890" };

describe("validasi formulir pendaftaran 4 tahap", () => {
  it("tahap 1 mewajibkan nama, NISN, tanggal lahir, dan nomor HP", () => {
    expect(Object.keys(validasiTahap(1, DATA_KOSONG, {})).sort()).toEqual(["nama", "nisn", "no_hp", "tanggal_lahir"]);
  });
  it("tahap 1 lolos tanpa alamat, jenis kelamin, dan agama", () => {
    expect(validasiTahap(1, lengkap1, {})).toEqual({});
  });
  it("NISN harus tepat 10 digit angka", () => {
    expect(validasiTahap(1, { ...lengkap1, nisn: "123456789" }, {}).nisn).toBe("NISN harus 10 digit angka.");
    expect(validasiTahap(1, { ...lengkap1, nisn: "12345678ab" }, {}).nisn).toBe("NISN harus 10 digit angka.");
  });
  it("tahap 2 mewajibkan sekolah asal dan jurusan pilihan 1", () => {
    expect(Object.keys(validasiTahap(2, DATA_KOSONG, {})).sort()).toEqual(["asal_sekolah", "jurusan"]);
    expect(validasiTahap(2, { ...DATA_KOSONG, asal_sekolah: "SMP N 1", jurusan: "Teknik Sepeda Motor" }, {})).toEqual({});
  });
  it("tahap 3 mewajibkan pas foto, berkas lain opsional", () => {
    expect(validasiTahap(3, DATA_KOSONG, {}).foto).toBe("Pas foto 3x4 wajib diunggah.");
    expect(validasiTahap(3, DATA_KOSONG, { foto: {} })).toEqual({});
  });
  it("mengenali kolom yang belum ada di database", () => {
    expect(kolomTakDikenal("Could not find the 'agama' column of 'pendaftar' in the schema cache")).toBe("agama");
    expect(kolomTakDikenal("duplicate key")).toBeNull();
  });
  it("mode tanpa upload dokumen: pas foto tidak wajib", () => {
    expect(validasiTahap(3, DATA_KOSONG, {}, false).foto).toBeUndefined();
    expect(validasiTahap(3, DATA_KOSONG, {}, true).foto).toBeDefined();
  });
});

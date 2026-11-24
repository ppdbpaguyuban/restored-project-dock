import { describe, it, expect } from "vitest";
import { cekOtomatis, hpValid, noWa, type Row } from "@/lib/verifikasi";
const now = new Date("2027-11-21");
const base: Row = { id: "1", nama: "Budi Santoso", nisn: "0098765432", no_hp: "081327465812", tahun_ajaran: "2027/2028", tanggal_lahir: "2011-05-01", berkas_foto: "a", berkas_kk: "a", berkas_akta: "a", berkas_skl: "a" };
describe("verifikasi otomatis", () => {
  it("data lengkap & wajar = siap", () => expect(cekOtomatis(base, [base], true, now).level).toBe("siap"));
  it("NISN ganda di tahun ajaran sama = fiktif", () => expect(cekOtomatis(base, [base, { ...base, id: "2" }], true, now).level).toBe("fiktif"));
  it("berkas kurang = perhatian", () => expect(cekOtomatis({ ...base, berkas_kk: null }, [], true, now).level).toBe("perhatian"));
  it("berkas kurang diabaikan bila mode tanpa upload", () => expect(cekOtomatis({ ...base, berkas_kk: null }, [], false, now).level).toBe("siap"));
  it("usia 25 = perhatian", () => expect(cekOtomatis({ ...base, tanggal_lahir: "2001-01-01" }, [], true, now).level).toBe("perhatian"));
  it("nomor HP dummy ditolak", () => { expect(hpValid("081234567890")).toBe(false); expect(hpValid("08111111111")).toBe(false); expect(hpValid("081327465812")).toBe(true); });
  it("nomor 08 diubah ke 62", () => expect(noWa("0813-2746-5812")).toBe("6281327465812"));
});

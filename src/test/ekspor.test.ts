import { describe, it, expect } from "vitest";
import { laporanSementara, pindah } from "@/lib/ekspor";
const g = (nama: string, mulai: string, selesai: string, status?: "ditutup") => ({ id: nama, nama, tahun_ajaran: "x", mulai, selesai, ...(status ? { status } : {}) });
describe("label laporan sementara", () => {
  it("sementara jika gelombang masih dibuka", () => expect(laporanSementara([g("G1", "2000-01-01", "2999-01-01")], "G1")).toBe(true));
  it("final jika gelombang sudah lewat", () => expect(laporanSementara([g("G1", "2000-01-01", "2000-02-01")], "G1")).toBe(false));
  it("final jika gelombang ditutup panitia", () => expect(laporanSementara([g("G1", "2000-01-01", "2999-01-01", "ditutup")], "G1")).toBe(false));
  it("semua gelombang: sementara bila salah satu masih buka", () => expect(laporanSementara([g("G1", "2000-01-01", "2000-02-01"), g("G2", "2000-01-01", "2999-01-01")], "")).toBe(true));
});
it("reorder kolom", () => expect(pindah(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]));

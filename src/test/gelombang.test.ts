import { describe, expect, it } from "vitest";
import { gelombangAktif, gelombangBentrok, gelombangBeranda, statusGelombang, urutkanGelombang } from "@/lib/tahun";

const g = { id: "1", nama: "Gelombang I", tahun_ajaran: "2027/2028", mulai: "2027-01-10", selesai: "2027-02-10" };

describe("status gelombang berdasarkan tanggal buka/tutup", () => {
  it("akan datang sebelum tanggal buka", () => expect(statusGelombang(g, "2027-01-09")).toBe("akan"));
  it("dibuka pada tanggal buka dan tutup (inklusif)", () => {
    expect(statusGelombang(g, "2027-01-10")).toBe("dibuka");
    expect(statusGelombang(g, "2027-02-10")).toBe("dibuka");
  });
  it("selesai setelah tanggal tutup", () => expect(statusGelombang(g, "2027-02-11")).toBe("selesai"));
  it("formulir hanya terbuka dalam rentang gelombang", () => {
    expect(gelombangAktif([g], "2027-01-15")?.id).toBe("1");
    expect(gelombangAktif([g], "2027-03-01")).toBeUndefined();
  });
});

describe("tumpang tindih gelombang", () => {
  it("terdeteksi bila rentang beririsan", () => expect(gelombangBentrok([g], { mulai: "2027-02-01", selesai: "2027-03-01" })).toHaveLength(1));
  it("bentrok bila tanggal buka sama dengan tanggal tutup gelombang lain", () => expect(gelombangBentrok([g], { mulai: "2027-02-10", selesai: "2027-03-01" })).toHaveLength(1));
  it("tidak bentrok bila dimulai sehari setelahnya", () => expect(gelombangBentrok([g], { mulai: "2027-02-11", selesai: "2027-03-01" })).toHaveLength(0));
  it("mengabaikan gelombang yang sedang diubah", () => expect(gelombangBentrok([g], { id: "1", mulai: "2027-01-01", selesai: "2027-02-20" })).toHaveLength(0));
});

describe("status & urutan gelombang yang diatur panitia", () => {
  const a = { ...g, id: "a", nama: "A", mulai: "2027-01-01", selesai: "2027-01-31", urutan: 2 };
  const b = { ...g, id: "b", nama: "B", mulai: "2027-02-01", selesai: "2027-02-28", urutan: 1 };
  it("beranda mengikuti nomor urut panitia, bukan tanggal", () => expect(gelombangBeranda([a, b]).map((x) => x.id)).toEqual(["b", "a"]));
  it("tanpa nomor urut, diurutkan menurut tanggal buka", () => expect(urutkanGelombang([{ ...b, urutan: null }, { ...a, urutan: null }]).map((x) => x.id)).toEqual(["a", "b"]));
  it("gelombang disembunyikan tidak tampil di beranda", () => expect(gelombangBeranda([a, { ...b, status: "sembunyi" as const }]).map((x) => x.id)).toEqual(["a"]));
  it("ditutup sementara: formulir tidak terbuka walau masih dalam tanggal", () => {
    expect(gelombangAktif([{ ...a, status: "ditutup" as const }], "2027-01-15")).toBeUndefined();
    expect(statusGelombang({ ...a, status: "ditutup" }, "2027-01-15")).toBe("ditutup");
  });
});

import { describe, expect, it } from "vitest";
import { cocokCari, urutkan } from "@/lib/cari";

const A = { id: "1", nama: "Budi Santoso", nisn: "0098765432", no_daftar: "PPDB-2728-RPL-AAA111", asal_sekolah: "SMP N 1 Bumiayu", no_hp: "081234567890", created_at: "2027-01-02T00:00:00Z", verifikasi: { "Pas Foto": true } };
const B = { id: "2", nama: "ani rahma", nisn: "0011223344", no_daftar: "PPDB-2728-TKR-BBB222", asal_sekolah: "MTs Paguyangan", no_hp: "6285700001111", created_at: "2027-01-05T00:00:00Z", verifikasi: { "Pas Foto": true, "Kartu Keluarga": true, "Akta Kelahiran": true } };
const C = { id: "3", nama: "Citra", nisn: "0055556666", no_daftar: null, asal_sekolah: "", no_hp: "089900001111", created_at: "2027-01-03T00:00:00Z", verifikasi: {} };

describe("pencarian per kategori", () => {
  it("kategori Nama tidak mencocokkan nama sekolah", () => {
    expect(cocokCari(A, "bumiayu", "nama")).toBe(false);
    expect(cocokCari(A, "bumiayu", "asal_sekolah")).toBe(true);
  });
  it("Semua data mencari di nama, no. daftar, NISN, sekolah, dan HP", () => {
    expect(cocokCari(B, "tkr-bbb", "semua")).toBe(true);
    expect(cocokCari(B, "paguyangan", "semua")).toBe(true);
    expect(cocokCari(A, "0098765432", "semua")).toBe(true);
  });
  it("HP 08xx menemukan nomor yang tersimpan 628xx", () => {
    expect(cocokCari(B, "0857 0000", "no_hp")).toBe(true);
    expect(cocokCari(A, "0857", "no_hp")).toBe(false);
  });
});

describe("pengurutan", () => {
  const ids = (r: { id: string }[]) => r.map((x) => x.id);
  it("terbaru dan terlama mengikuti waktu daftar", () => {
    expect(ids(urutkan([A, B, C], "baru"))).toEqual(["2", "3", "1"]);
    expect(ids(urutkan([A, B, C], "lama"))).toEqual(["1", "3", "2"]);
  });
  it("nama A-Z tidak membedakan huruf besar/kecil", () => {
    expect(ids(urutkan([A, B, C], "nama_az"))).toEqual(["2", "1", "3"]);
  });
  it("no. daftar & asal sekolah kosong ditaruh paling akhir", () => {
    expect(ids(urutkan([C, B, A], "no_daftar"))).toEqual(["1", "2", "3"]);
    expect(ids(urutkan([C, A, B], "sekolah"))).toEqual(["2", "1", "3"]);
  });
  it("checklist paling sedikit lebih dulu", () => {
    expect(ids(urutkan([A, B, C], "cek_sedikit"))).toEqual(["3", "1", "2"]);
    expect(ids(urutkan([A, B, C], "cek_banyak"))).toEqual(["2", "1", "3"]);
  });
});

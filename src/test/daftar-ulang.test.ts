import { describe, it, expect } from "vitest";
import { totalBiaya, sisaBiaya, rapikanDU } from "@/lib/daftar-ulang";
const d = { items: [{ nama: "Seragam", nominal: 500000 }, { nama: "Buku", nominal: 250000 }], dibayar: 300000 };
describe("daftar ulang", () => {
  it("menjumlah total biaya", () => expect(totalBiaya(d)).toBe(750000));
  it("sisa = total - dibayar", () => expect(sisaBiaya(d)).toBe(450000));
  it("lunas berarti sisa 0", () => expect(sisaBiaya({ ...d, status_bayar: "lunas" })).toBe(0));
  it("membuang baris tanpa nama", () => expect(rapikanDU({ items: [{ nama: " ", nominal: 5 }, { nama: "MPLS", nominal: 100 }] }).items).toEqual([{ nama: "MPLS", nominal: 100 }]));
});

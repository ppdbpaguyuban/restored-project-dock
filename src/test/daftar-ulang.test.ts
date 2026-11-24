import { describe, it, expect } from "vitest";
import { totalBiaya, sisaBiaya, rapikanDU, statusBayar, sinkronDU, bacaDU } from "@/lib/daftar-ulang";
const d = { items: [{ nama: "Seragam", nominal: 500000 }, { nama: "Buku", nominal: 250000 }], dibayar: 300000 };
describe("daftar ulang", () => {
  it("menjumlah total biaya", () => expect(totalBiaya(d)).toBe(750000));
  it("sisa = total - dibayar", () => expect(sisaBiaya(d)).toBe(450000));
  it("membuang baris tanpa nama", () => expect(rapikanDU({ items: [{ nama: " ", nominal: 5 }, { nama: "MPLS", nominal: 100 }] }).items).toEqual([{ nama: "MPLS", nominal: 100 }]));
});
describe("sinkron status bayar dengan nominal Sudah Dibayar", () => {
  it("dibayar 0 berarti Belum bayar", () => expect(statusBayar(750000, 0)).toBe("belum"));
  it("dibayar di antara 0 dan total berarti Dicicil", () => expect(statusBayar(750000, 300000)).toBe("cicil"));
  it("dibayar sama dengan total berarti Lunas", () => expect(statusBayar(750000, 750000)).toBe("lunas"));
  it("dibayar melebihi total berarti Lunas dengan sisa 0", () => {
    expect(sinkronDU({ ...d, dibayar: 900000 }).status_bayar).toBe("lunas");
    expect(sisaBiaya({ ...d, dibayar: 900000 })).toBe(0);
  });
  it("status tersimpan yang salah ditimpa sesuai nominal", () => expect(sinkronDU({ ...d, status_bayar: "lunas" }).status_bayar).toBe("cicil"));
  it("status Lunas tidak menghapus sisa bila nominal belum cukup", () => expect(sisaBiaya({ ...d, status_bayar: "lunas" })).toBe(450000));
  it("nominal negatif dijadikan 0 dan Belum bayar", () => expect(sinkronDU({ ...d, dibayar: -5000 })).toMatchObject({ dibayar: 0, status_bayar: "belum" }));
  it("total naik melebihi dibayar: Lunas kembali menjadi Dicicil", () => {
    const lunas = sinkronDU({ items: [{ nama: "Seragam", nominal: 300000 }], dibayar: 300000 });
    expect(lunas.status_bayar).toBe("lunas");
    const naik = sinkronDU({ ...lunas, items: [...lunas.items, { nama: "MPLS", nominal: 100000 }] });
    expect(naik.status_bayar).toBe("cicil");
    expect(sisaBiaya(naik)).toBe(100000);
  });
  it("simpan selalu mengirim status sesuai nominal", () => expect(rapikanDU({ items: [{ nama: "MPLS", nominal: 100 }], dibayar: 100, status_bayar: "belum" }).status_bayar).toBe("lunas"));
  it("data lama bertanda Lunas tanpa nominal tetap Lunas saat dibaca", () => expect(bacaDU({ ...d, dibayar: 0, status_bayar: "lunas" })).toMatchObject({ dibayar: 750000, status_bayar: "lunas" }));
  it("data lama bertanda Belum tapi sudah ada nominal dibaca sesuai nominal", () => expect(bacaDU({ ...d, status_bayar: "belum" }).status_bayar).toBe("cicil"));
});

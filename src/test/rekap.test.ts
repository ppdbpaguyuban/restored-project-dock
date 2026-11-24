import { describe, expect, it } from "vitest";
import { rekapJurusan } from "@/lib/rekap";
import { CEK_VERIFIKASI } from "@/lib/lacak";

const semua = Object.fromEntries(CEK_VERIFIKASI.map((c) => [c, true]));
const rows = [
  { jurusan: "Rekayasa Perangkat Lunak", status: "baru", verifikasi: {} },
  { jurusan: "Rekayasa Perangkat Lunak", status: "diterima", verifikasi: semua },
  { jurusan: "Teknik Sepeda Motor", status: null, verifikasi: { "Pas Foto": true } },
];

describe("rekap per jurusan", () => {
  it("menghitung jumlah pendaftar per jurusan dan menampilkan jurusan kosong", () => {
    const r = rekapJurusan(rows);
    expect(r.find((x) => x.kode === "RPL")?.total).toBe(2);
    expect(r.find((x) => x.kode === "TSM")?.total).toBe(1);
    expect(r.find((x) => x.kode === "BDF")?.total).toBe(0);
    expect(r).toHaveLength(5);
  });
  it("checklist dianggap lengkap hanya bila semua butir dicentang", () => {
    const rpl = rekapJurusan(rows).find((x) => x.kode === "RPL")!;
    expect(rpl.lengkap).toBe(1);
    expect(rpl.perluCek).toBe(1);
    expect(rekapJurusan(rows).find((x) => x.kode === "TSM")?.perluCek).toBe(1);
  });
  it("status kosong dihitung sebagai belum diverifikasi", () => {
    expect(rekapJurusan(rows).find((x) => x.kode === "TSM")?.baru).toBe(1);
  });
});

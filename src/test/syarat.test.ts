import { describe, expect, it } from "vitest";
import { daftarSyarat, SYARAT_DEFAULT } from "@/lib/tahun";

describe("syarat pendaftaran", () => {
  it("satu syarat per baris, nomor/poin di awal dibuang", () => {
    expect(daftarSyarat("1. Pas foto\n- Fotokopi KK\n\n• Akta")).toEqual(["Pas foto", "Fotokopi KK", "Akta"]);
  });
  it("kosong memakai syarat bawaan", () => {
    expect(daftarSyarat("  \n ")).toEqual(SYARAT_DEFAULT);
    expect(daftarSyarat(null)).toEqual(SYARAT_DEFAULT);
  });
});

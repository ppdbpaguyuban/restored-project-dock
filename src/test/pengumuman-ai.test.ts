import { describe, expect, it } from "vitest";
import { rapikanHasil, validasiDraf, MAKS_DRAF } from "@/lib/pengumuman-ai";
import { MAKS_PENGUMUMAN } from "@/lib/tahun";

describe("asisten pengumuman AI", () => {
  it("menolak draf kosong", () => {
    expect(validasiDraf("   ")).not.toBeNull();
  });
  it("menolak draf lebih dari batas", () => {
    expect(validasiDraf("a".repeat(MAKS_DRAF + 1))).not.toBeNull();
    expect(validasiDraf("Gelombang 2 dibuka 1 Desember")).toBeNull();
  });
  it("membuang markdown dan awalan Pengumuman: dari hasil", () => {
    expect(rapikanHasil('"Pengumuman: **Gelombang 2** dibuka."')).toBe("Gelombang 2 dibuka.");
  });
  it("hasil tidak pernah melebihi batas karakter pengumuman", () => {
    expect(rapikanHasil("kata ".repeat(400)).length).toBeLessThanOrEqual(MAKS_PENGUMUMAN + 1);
  });
});

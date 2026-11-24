import { describe, it, expect } from "vitest";
import { validasiProfil } from "@/lib/tahun";

const ok = { alamat: "Jl. Pangeran Diponegoro No.184, Paguyangan", telepon: "(0289) 430390", email: "office@smkmutupgy.sch.id", maps_url: "https://www.google.com/maps?q=-7.28,109.02" };
describe("validasiProfil", () => {
  it("menerima data valid", () => expect(validasiProfil(ok)).toEqual([]));
  it("menerima koordinat", () => expect(validasiProfil({ ...ok, maps_url: "-7.28, 109.02" })).toEqual([]));
  it("menolak alamat terlalu pendek", () => expect(validasiProfil({ ...ok, alamat: "Jl." })).toHaveLength(1));
  it("menolak telepon berhuruf", () => expect(validasiProfil({ ...ok, telepon: "abc123" })).toHaveLength(1));
  it("menolak email salah", () => expect(validasiProfil({ ...ok, email: "office@" })).toHaveLength(1));
  it("menolak link bukan Google Maps", () => expect(validasiProfil({ ...ok, maps_url: "https://evil.com/maps" })).toHaveLength(1));
});

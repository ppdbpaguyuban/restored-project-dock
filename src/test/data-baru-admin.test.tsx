import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => {
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => Promise.resolve({ data: [], error: null }) };
  return { supabase: { from: () => q, storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: "https://x/y.webp" } }) }) } } };
});

import { VerifPanel } from "@/components/VerifPanel";
import { KOLOM } from "@/lib/ekspor";
import { cekOtomatis } from "@/lib/verifikasi";

const r = {
  id: "1", nama: "Budi Santoso", nisn: "0098765432", no_hp: "081327465812", jurusan: "Teknik Sepeda Motor", asal_sekolah: "SMP N 1", status: "baru",
  tahun_ajaran: "2027/2028", tanggal_lahir: "2011-05-01", jenis_kelamin: "Laki-laki", agama: "Islam", kota_sekolah: "Brebes", tahun_lulus: "2027",
  jurusan_2: "Teknik Ototronik", berkas_foto: "a/foto.webp", berkas_kip: "a/kip.pdf",
};

describe("data baru formulir di halaman Admin", () => {
  it("panel verifikasi menampilkan jenis kelamin, agama, kota, tahun lulus, jurusan 2, dan berkas KIP", () => {
    render(<VerifPanel r={r} cek={[]} peringatan={[]} level="siap" petugas="Admin" statusList={["baru"]} onClose={() => {}} onSave={async () => {}} />);
    for (const t of ["Laki-laki", "Islam", "Brebes", "2027", "Teknik Ototronik", "KIP / KKS / PKH"]) expect(screen.getByText(t)).toBeInTheDocument();
  });
  it("kolom baru bisa dipilih di ekspor", () => {
    const k = KOLOM.map((c) => c.k);
    for (const x of ["jenis_kelamin", "agama", "kota_sekolah", "tahun_lulus", "jurusan_2"]) expect(k).toContain(x);
  });
  it("KIP tidak dihitung sebagai berkas kurang", () => {
    const { peringatan } = cekOtomatis({ ...r, berkas_kk: "a", berkas_akta: "a", berkas_skl: "a", berkas_kip: null }, [], true, new Date("2027-06-01"));
    expect(peringatan.some((p) => p.includes("KIP"))).toBe(false);
  });
});

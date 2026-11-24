import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const upload = vi.fn().mockResolvedValue({ error: null });
const gelombangHariIni = { id: "gel-1", nama: "Gelombang Percobaan", tahun_ajaran: "2027/2028", mulai: "2000-01-01", selesai: "2999-12-31", status: "otomatis" };
const bucket = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (t: string) => (t === "gelombang" ? { select: () => ({ eq: () => Promise.resolve({ data: [gelombangHariIni], error: null }) }) } : { insert }),
    storage: { from: (b: string) => { bucket(b); return { upload }; } },
  },
}));
vi.mock("@/lib/compress", () => ({ compressImage: async (f: File) => f }));

import { RegForm } from "@/components/RegForm";
import { isiDataDiri, unggahFotoDanLanjut } from "./regform-helper";

async function isiDanKirim() {
  render(<RegForm tahunAjaran="2027/2028" wajibBerkas={false} telepon="(0289) 430390" />);
  isiDataDiri({ nama: "Budi Santoso", nisn: "0012345678", hp: "081234567890", tgl: "2010-05-01" });
  fireEvent.change(screen.getByPlaceholderText("Asal SMP/MTs"), { target: { value: "SMP N 1" } });
  fireEvent.click(screen.getByRole("radio", { name: /Teknik Sepeda Motor/i }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
  await unggahFotoDanLanjut();
  fireEvent.click(screen.getByRole("button", { name: "Kirim Pendaftaran" }));
}

beforeEach(() => { insert.mockReset(); upload.mockClear(); bucket.mockClear(); });

describe("halaman konfirmasi setelah pendaftaran terkirim", () => {
  it("menampilkan nomor pendaftaran yang sama dengan yang disimpan, plus langkah selanjutnya", async () => {
    insert.mockResolvedValue({ error: null });
    await isiDanKirim();
    expect(await screen.findByText("Pendaftaran Berhasil Terkirim")).toBeInTheDocument();
    const tersimpan = insert.mock.calls[0]?.[0] as { no_daftar?: string } | undefined;
    expect(tersimpan?.no_daftar).toMatch(/^PPDB-2728-TSM-/);
    expect(screen.getByText(tersimpan?.no_daftar ?? "-")).toBeInTheDocument();
    expect(screen.getByText("Langkah selanjutnya")).toBeInTheDocument();
    expect(screen.getByText(/Panitia akan menghubungi 081234567890/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salin Nomor Pendaftaran" })).toBeInTheDocument();
    expect(screen.getByText("Simpan nomor ini! Gunakan untuk cek status pendaftaran.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cek Status Sekarang" })).toHaveAttribute("href", `/lacak?no=${encodeURIComponent(tersimpan?.no_daftar ?? "")}`);
  });

  it("berkas diunggah ke folder bernama nomor pendaftaran, dan gelombang yang dibuka hari ini ikut tersimpan", async () => {
    insert.mockResolvedValue({ error: null });
    await isiDanKirim();
    await screen.findByText("Pendaftaran Berhasil Terkirim");
    const row = insert.mock.calls[0]?.[0] as { no_daftar: string; berkas_foto: string };
    expect(bucket).toHaveBeenCalledWith("berkas");
    expect(upload.mock.calls[0]?.[0]).toBe(`${row.no_daftar}/foto.png`.replace(".png", ".webp"));
    expect(row).toMatchObject({ berkas_foto: `${row.no_daftar}/foto.webp`, gelombang: "Gelombang Percobaan", gelombang_id: "gel-1", tahun_ajaran: "2027/2028" });
  });

  it("NISN yang sudah terdaftar ditolak dengan pesan jelas", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: 'duplicate key value violates unique constraint "pendaftar_nisn_ta_key"' } });
    await isiDanKirim();
    expect(await screen.findByText("NISN sudah terdaftar")).toBeInTheDocument();
    expect(screen.queryByText("Pendaftaran Berhasil Terkirim")).not.toBeInTheDocument();
  });

  it("gangguan lain menampilkan ajakan mencoba lagi", async () => {
    insert.mockResolvedValue({ error: { code: "42501", message: "new row violates row-level security policy" } });
    await isiDanKirim();
    expect(await screen.findByText("Gagal mengirim, coba lagi.")).toBeInTheDocument();
  });

  it("tetap tersimpan bila kolom nomor belum dibuat di database", async () => {
    insert.mockResolvedValueOnce({ error: { message: "Could not find the 'no_daftar' column of 'pendaftar' in the schema cache" } }).mockResolvedValueOnce({ error: null });
    await isiDanKirim();
    expect(await screen.findByText("Pendaftaran Berhasil Terkirim")).toBeInTheDocument();
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[1]?.[0]).not.toHaveProperty("no_daftar");
  });

  it("tetap tersimpan bila kolom berkas belum dibuat, kolom lain tetap terkirim", async () => {
    insert.mockResolvedValueOnce({ error: { message: "Could not find the 'berkas_foto' column of 'pendaftar' in the schema cache" } }).mockResolvedValueOnce({ error: null });
    await isiDanKirim();
    expect(await screen.findByText("Pendaftaran Berhasil Terkirim")).toBeInTheDocument();
    expect(insert.mock.calls[1]?.[0]).not.toHaveProperty("berkas_foto");
    expect(insert.mock.calls[1]?.[0]).toMatchObject({ nama: "Budi Santoso", no_daftar: expect.stringMatching(/^PPDB-2728-/) });
  });
});

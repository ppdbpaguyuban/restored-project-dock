import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { LacakForm } from "@/components/LacakForm";

function cari(no: string, tgl: string) {
  render(<LacakForm />);
  fireEvent.change(screen.getByPlaceholderText("PPDB-2728-RPL-7KQ4XM"), { target: { value: no } });
  const d = document.querySelector('input[type="date"]');
  if (d instanceof HTMLInputElement) fireEvent.change(d, { target: { value: tgl } });
  fireEvent.click(screen.getByRole("button", { name: "Cek Status" }));
}

beforeEach(() => rpc.mockReset());

describe("formulir cek status", () => {
  it("wajib nomor pendaftaran DAN tanggal lahir; keduanya dikirim ke pemeriksaan", async () => {
    rpc.mockResolvedValue({ data: [{ no_daftar: "PPDB-2728-TSM-AB12CD", nama: "Siti", jurusan: "Teknik Sepeda Motor", gelombang: null, tahun_ajaran: "2027/2028", status: "baru", verifikasi: { "Pas Foto": true }, didaftar_at: null, diverifikasi_at: null }], error: null });
    cari("ppdb-2728-tsm-ab12cd", "2010-05-01");
    expect(await screen.findByText("Sedang diperiksa")).toBeInTheDocument();
    expect(rpc).toHaveBeenCalledWith("lacak_pendaftaran", { p_no: "PPDB-2728-TSM-AB12CD", p_tgl: "2010-05-01" });
    expect(screen.getByText("1 dari 5 butir sudah diperiksa panitia.")).toBeInTheDocument();
  });
  it("tanpa tanggal lahir tidak memeriksa sama sekali", () => {
    cari("PPDB-2728-TSM-AB12CD", "");
    expect(rpc).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("tanggal lahir");
  });
  it("nomor/tanggal tidak cocok: tidak menampilkan data apa pun", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    cari("PPDB-2728-TSM-AB12CD", "2010-05-02");
    expect(await screen.findByRole("alert")).toHaveTextContent("Data tidak ditemukan");
    expect(screen.queryByText("Status pendaftaran")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn().mockResolvedValue({ error: null });
const upload = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase", () => ({ supabase: { from: () => ({ insert }), storage: { from: () => ({ upload }) } } }));
vi.mock("@/lib/compress", () => ({ compressImage: async (f: File) => f }));

import { RegForm } from "@/components/RegForm";
import { isiDataDiri, unggahFotoDanLanjut } from "./regform-helper";

async function isiSampaiRingkasan() {
  render(<RegForm tahunAjaran="2027/2028" wajibBerkas={false} />);
  isiDataDiri({ nama: "Siti Aminah", nisn: "0099887766", hp: "081298765432", tgl: "2010-08-17", alamat: "Jl. Kenanga 2, Paguyangan" });
  fireEvent.change(screen.getByPlaceholderText("Asal SMP/MTs"), { target: { value: "SMP Negeri 1 Paguyangan" } });
  fireEvent.click(screen.getByRole("radio", { name: /Rekayasa Perangkat Lunak/i }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
  await unggahFotoDanLanjut();
}

beforeEach(() => { insert.mockClear(); upload.mockClear(); });

describe("halaman ringkasan pendaftaran", () => {
  it("menampilkan jawaban dan belum mengirim sebelum tombol Kirim ditekan", async () => {
    await isiSampaiRingkasan();
    expect(screen.getByText(/Tahap 4 dari 4/)).toBeInTheDocument();
    const dataDiri = screen.getByRole("region", { name: "Data Diri" });
    expect(within(dataDiri).getByText("Siti Aminah")).toBeInTheDocument();
    expect(within(dataDiri).getByText("0099887766")).toBeInTheDocument();
    const sekolah = screen.getByRole("region", { name: "Sekolah & Jurusan" });
    expect(within(sekolah).getByText("Rekayasa Perangkat Lunak")).toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it("jawaban yang diubah dari ringkasan ikut terkirim", async () => {
    await isiSampaiRingkasan();
    fireEvent.click(screen.getByRole("button", { name: "Ubah Data Diri" }));
    fireEvent.change(screen.getByPlaceholderText("Nama lengkap"), { target: { value: "Siti Aminah Putri" } });
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke Ringkasan" }));

    expect(within(screen.getByRole("region", { name: "Data Diri" })).getByText("Siti Aminah Putri")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Kirim Pendaftaran" }));
    await vi.waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert.mock.calls[0]?.[0]).toMatchObject({ nama: "Siti Aminah Putri", jurusan: "Rekayasa Perangkat Lunak" });
    expect(upload).toHaveBeenCalledTimes(1);
  });
});

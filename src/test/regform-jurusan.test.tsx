import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn().mockResolvedValue({ error: null });
const upload = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase", () => ({ supabase: { from: () => ({ insert }), storage: { from: () => ({ upload }) } } }));
vi.mock("@/lib/compress", () => ({ compressImage: async (f: File) => f }));

import { RegForm } from "@/components/RegForm";
import { isiDataDiri, unggahFotoDanLanjut } from "./regform-helper";

// Alur nyata: langkah 1 (Sekolah & Jurusan) baru tampil setelah langkah 0 lengkap.
function bukaLangkahJurusan(wajibBerkas = true) {
  render(<RegForm tahunAjaran="2027/2028" wajibBerkas={wajibBerkas} />);
  isiDataDiri({ nama: "Ahmad Fauzi", nisn: "0011223344", hp: "081234567890", tgl: "2010-05-14" });
}

const DESKRIPSI: Record<string, string> = {
  "Teknik Kendaraan Ringan": "diagnosis sistem mekanik serta kelistrikan mobil",
  "Teknik Sepeda Motor": "perbaikan mesin, dan kelistrikan sepeda motor",
  "Teknik Ototronik": "elektronik, kontrol, dan kelistrikan modern pada kendaraan",
  "Rekayasa Perangkat Lunak": "menguji, dan memelihara aplikasi atau perangkat lunak",
  "Broadcasting dan Perfilman": "sinematografi, penyutradaraan, dan penyiaran",
};

beforeEach(() => {
  insert.mockClear();
});

describe("deskripsi jurusan pada formulir pendaftaran", () => {
  it("menampilkan kelima jurusan beserta deskripsinya di langkah jurusan", () => {
    bukaLangkahJurusan();

    for (const [nama, deskripsi] of Object.entries(DESKRIPSI)) {
      const kartu = screen.getByRole("radio", { name: new RegExp(nama, "i") });
      expect(kartu).toBeInTheDocument();
      expect(kartu.closest("label")?.textContent).toContain(deskripsi);
    }
  });

  it("jurusan terpilih terpakai saat pendaftaran dikirim", async () => {
    bukaLangkahJurusan(false);
    fireEvent.change(screen.getByPlaceholderText("Asal SMP/MTs"), { target: { value: "SMP Muhammadiyah 1" } });
    fireEvent.click(screen.getByRole("radio", { name: /Teknik Ototronik/i }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    await unggahFotoDanLanjut();
    fireEvent.click(screen.getByRole("button", { name: "Kirim Pendaftaran" }));

    await vi.waitFor(() => expect(insert).toHaveBeenCalled());
    const terkirim = insert.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(terkirim).toMatchObject({ jurusan: "Teknik Ototronik" });
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormCepat } from "@/components/FormCepat";

describe("formulir cepat PPDB", () => {
  it("meminta data lengkap sebelum melanjutkan", () => {
    render(<FormCepat onLanjut={vi.fn()} dibuka />);
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan Pendaftaran" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Lengkapi keempat data");
  });

  it("meneruskan keempat data awal ke formulir lengkap", () => {
    const onLanjut = vi.fn();
    render(<FormCepat onLanjut={onLanjut} dibuka />);
    fireEvent.change(screen.getByLabelText("Nama lengkap formulir cepat"), { target: { value: "Ahmad Fauzi" } });
    fireEvent.change(screen.getByLabelText("Tanggal lahir formulir cepat"), { target: { value: "2010-05-14" } });
    fireEvent.change(screen.getByLabelText("Program keahlian formulir cepat"), { target: { value: "Teknik Ototronik" } });
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp formulir cepat"), { target: { value: "081234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan Pendaftaran" }));
    expect(onLanjut).toHaveBeenCalledWith({ nama: "Ahmad Fauzi", tanggal_lahir: "2010-05-14", jurusan: "Teknik Ototronik", no_hp: "081234567890" });
  });
});

import { fireEvent, screen } from "@testing-library/react";

/** Isi tahap 1 (data diri) dengan data wajib lalu tekan Lanjut. */
export function isiDataDiri(d: { nama: string; nisn: string; hp: string; tgl: string; alamat?: string }) {
  fireEvent.change(screen.getByPlaceholderText("Nama lengkap"), { target: { value: d.nama } });
  fireEvent.change(screen.getByPlaceholderText("NISN (10 angka)"), { target: { value: d.nisn } });
  fireEvent.change(screen.getByPlaceholderText("No. HP / WhatsApp"), { target: { value: d.hp } });
  if (d.alamat) fireEvent.change(screen.getByPlaceholderText("Alamat lengkap"), { target: { value: d.alamat } });
  fireEvent.change(screen.getByLabelText(/Tanggal lahir/), { target: { value: d.tgl } });
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
}

/** Unggah pas foto di tahap 3 lalu tekan Lanjut menuju ringkasan. */
export async function unggahFotoDanLanjut() {
  const foto = new File(["x"], "foto.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Unggah Pas Foto 3x4"), { target: { files: [foto] } });
  await screen.findByRole("button", { name: "Hapus Pas Foto 3x4" });
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
}

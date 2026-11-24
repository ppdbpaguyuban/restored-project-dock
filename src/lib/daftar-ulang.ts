// Rincian daftar ulang untuk calon siswa yang diterima (kolom jsonb `pendaftar.daftar_ulang`).
export type ItemBiaya = { nama: string; nominal: number };
export type StatusBayar = "belum" | "cicil" | "lunas";
export type DaftarUlang = { items: ItemBiaya[]; dibayar?: number; status_bayar?: StatusBayar; batas?: string; catatan?: string };

export const LABEL_BAYAR: Record<StatusBayar, string> = { belum: "Belum bayar", cicil: "Dicicil", lunas: "Lunas" };
export const ITEM_DEFAULT: ItemBiaya[] = [
  { nama: "Seragam", nominal: 0 },
  { nama: "Buku / modul", nominal: 0 },
  { nama: "MPLS", nominal: 0 },
];

export const totalBiaya = (d?: DaftarUlang | null) => (d?.items ?? []).reduce((s, i) => s + (Number(i.nominal) || 0), 0);
/** Nominal dibayar yang sah: bilangan bulat, tidak pernah negatif. */
export const nominalDibayar = (d?: DaftarUlang | null) => Math.max(0, Math.round(Number(d?.dibayar) || 0));
/** Status bayar selalu diturunkan dari nominal Sudah Dibayar terhadap Total Biaya. */
export const statusBayar = (total: number, dibayar: number): StatusBayar => (dibayar <= 0 ? "belum" : dibayar < total ? "cicil" : "lunas");
export const statusBayarDU = (d?: DaftarUlang | null): StatusBayar => statusBayar(totalBiaya(d), nominalDibayar(d));
/** Sisa = Total Biaya - Sudah Dibayar (minimal 0). */
export const sisaBiaya = (d?: DaftarUlang | null) => Math.max(0, totalBiaya(d) - nominalDibayar(d));
/** Samakan nominal & status: dibayar tidak negatif, status mengikuti nominal. */
export const sinkronDU = (d: DaftarUlang): DaftarUlang => {
  const dibayar = nominalDibayar(d);
  return { ...d, dibayar, status_bayar: statusBayar(totalBiaya(d), dibayar) };
};
export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
/** Baca data tersimpan. Data lama yang ditandai Lunas tanpa nominal lengkap dianggap lunas (nominal = total). */
export const bacaDU = (d: DaftarUlang): DaftarUlang => {
  const total = totalBiaya(d);
  return sinkronDU(d.status_bayar === "lunas" && nominalDibayar(d) < total ? { ...d, dibayar: total } : d);
};
/** Buang baris kosong sebelum disimpan, lalu sinkronkan status bayar. */
export const rapikanDU = (d: DaftarUlang): DaftarUlang => sinkronDU({ ...d, items: d.items.filter((i) => i.nama.trim()).map((i) => ({ nama: i.nama.trim(), nominal: Math.max(0, Number(i.nominal) || 0) })) });

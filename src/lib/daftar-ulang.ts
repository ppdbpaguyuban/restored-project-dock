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
export const sisaBiaya = (d?: DaftarUlang | null) => (d?.status_bayar === "lunas" ? 0 : Math.max(0, totalBiaya(d) - (Number(d?.dibayar) || 0)));
export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
/** Buang baris kosong sebelum disimpan. */
export const rapikanDU = (d: DaftarUlang): DaftarUlang => ({ ...d, items: d.items.filter((i) => i.nama.trim()).map((i) => ({ nama: i.nama.trim(), nominal: Math.max(0, Number(i.nominal) || 0) })) });

import { MAKS_PENGUMUMAN } from "@/lib/tahun";

export const MAKS_DRAF = 2000;
export const NADA_PENGUMUMAN = { resmi: "Resmi", ramah: "Ramah & hangat", singkat: "Singkat & padat" } as const;
export type NadaPengumuman = keyof typeof NADA_PENGUMUMAN;

/** Validasi draf/poin dari pengelola sebelum dikirim ke AI. Mengembalikan pesan error atau null. */
export function validasiDraf(draf: string): string | null {
  const t = draf.trim();
  if (t.length < 5) return "Tulis draf atau poin pengumuman terlebih dahulu (minimal 5 karakter).";
  if (t.length > MAKS_DRAF) return `Draf maksimal ${MAKS_DRAF} karakter.`;
  return null;
}

/** Rapikan keluaran model: buang markdown, tanda kutip pembungkus, dan awalan "Pengumuman:" (banner sudah menampilkannya). */
export function rapikanHasil(teks: string): string {
  let t = teks.replace(/\r/g, "").trim();
  t = t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/^\s*[-*]\s+/gm, "• ");
  t = t.replace(/^["“”']+|["“”']+$/g, "").trim();
  t = t.replace(/^(📢\s*)?pengumuman\s*[:：-]\s*/i, "").trim();
  t = t.replace(/\n{3,}/g, "\n\n");
  if (t.length > MAKS_PENGUMUMAN) t = t.slice(0, MAKS_PENGUMUMAN).replace(/\s+\S*$/, "").trimEnd() + "…";
  return t;
}

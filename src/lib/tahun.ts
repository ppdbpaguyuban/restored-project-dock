import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const DEFAULT_TA = "2027/2028";
export type Pengaturan = { id: number; tahun_ajaran: string; dibuka: boolean; wajib_berkas?: boolean; alamat?: string | null; telepon?: string | null; email?: string | null; maps_url?: string | null; pengumuman?: string | null; syarat?: string | null; logo_url?: string | null; header_url?: string | null; foto_tkr?: string | null; foto_tsm?: string | null; foto_totr?: string | null; foto_rpl?: string | null; foto_bdf?: string | null };

export const SEKOLAH_DEFAULT = {
  alamat: "Jl. Pangeran Diponegoro No.184, Taraban, Paguyangan, Kab. Brebes, Jawa Tengah 52276",
  telepon: "(0289) 430390",
  email: "office@smkmutupgy.sch.id",
  maps_url: "https://www.google.com/maps?q=-7.2894013,109.0299689",
};
/** Turn any Google Maps link/coords/address into an embeddable iframe src. */
export function mapsEmbed(url: string | null | undefined, alamat: string) {
  const u = (url ?? "").trim();
  if (u.includes("/maps/embed")) return u;
  const coord = u.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const q = coord ? `${coord[1]},${coord[2]}` : alamat;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
}

export type ProfilInput = { alamat: string; telepon: string; email: string; maps_url: string };
/** Returns a list of field errors (empty = valid). */
export function validasiProfil(f: ProfilInput): string[] {
  const e: string[] = [];
  const a = f.alamat.trim();
  if (a.length < 10) e.push("Alamat minimal 10 karakter.");
  if (a.length > 300) e.push("Alamat maksimal 300 karakter.");
  const t = f.telepon.trim();
  if (!t) e.push("Telepon wajib diisi.");
  else if (!/^[+\d\s()\-]{6,20}$/.test(t) || t.replace(/\D/g, "").length < 6) e.push("Telepon hanya boleh angka, spasi, +, -, ( ) dan minimal 6 digit.");
  const m = f.email.trim();
  if (m && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) || m.length > 255)) e.push("Format email tidak valid.");
  const u = f.maps_url.trim();
  const isCoord = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(u);
  let isMaps = false;
  try { const h = new URL(u).hostname; isMaps = u.startsWith("https://") && /(^|\.)google\.[a-z.]+$|^maps\.app\.goo\.gl$|^goo\.gl$/.test(h); } catch { /* not a URL */ }
  if (u && !isCoord && !isMaps) e.push("Tautan Maps harus link https Google Maps atau koordinat seperti -7.28, 109.02.");
  return e;
}
export const MAKS_PENGUMUMAN = 1000;

/** Syarat bawaan bila panitia belum mengisi syarat di panel Admin. */
export const SYARAT_DEFAULT = [
  "Lulus atau akan lulus SMP/MTs sederajat",
  "Pas foto berwarna terbaru",
  "Fotokopi Kartu Keluarga (KK)",
  "Fotokopi Akta Kelahiran",
  "SKL atau rapor semester terakhir",
];
/** Ubah teks syarat (satu syarat per baris) menjadi daftar; kosong → syarat bawaan. */
export function daftarSyarat(teks: string | null | undefined): string[] {
  const l = (teks ?? "").split("\n").map((x) => x.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  return l.length ? l : SYARAT_DEFAULT;
}

const KANAL = "ppdb-pengaturan";
/** Beri tahu tab beranda yang sedang terbuka bahwa pengaturan (mis. foto header) baru saja diubah. */
export function kabarkanPengaturan() {
  try { const c = new BroadcastChannel(KANAL); c.postMessage(Date.now()); c.close(); } catch { /* browser lama */ }
}

/** Pengaturan PPDB; `dimuat` = sudah dibaca dari database. Dibaca ulang saat tab kembali aktif atau admin menyimpan. */
export function useTahunAjaran() {
  const [p, setP] = useState<Pengaturan & { dimuat: boolean }>({ id: 1, tahun_ajaran: DEFAULT_TA, dibuka: true, dimuat: false });
  useEffect(() => {
    let aktif = true;
    const muat = () => supabase.from("pengaturan_ppdb").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (aktif) setP((s) => (data ? { ...(data as Pengaturan), dimuat: true } : { ...s, dimuat: true }));
    });
    muat();
    const onVis = () => { if (document.visibilityState === "visible") muat(); };
    document.addEventListener("visibilitychange", onVis);
    let c: BroadcastChannel | null = null;
    try { c = new BroadcastChannel(KANAL); c.onmessage = () => muat(); } catch { /* browser lama */ }
    return () => { aktif = false; document.removeEventListener("visibilitychange", onVis); c?.close(); };
  }, []);
  return p;
}

/** Status atur panitia: "otomatis" = mengikuti tanggal, "ditutup" = tampil tapi formulir ditutup, "sembunyi" = tidak tampil di beranda. */
export type AturGelombang = "otomatis" | "ditutup" | "sembunyi";
export type Gelombang = { id: string; nama: string; tahun_ajaran: string; mulai: string; selesai: string; urutan?: number | null; status?: AturGelombang | null };
export const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const bisaDibuka = (g: Pick<Gelombang, "status">) => (g.status ?? "otomatis") === "otomatis";
export const gelombangAktif = (list: Gelombang[], d = today()) => list.find((g) => bisaDibuka(g) && g.mulai <= d && d <= g.selesai);
export type StatusGelombang = "akan" | "dibuka" | "selesai" | "ditutup" | "sembunyi";
export const statusGelombang = (g: Pick<Gelombang, "mulai" | "selesai" | "status">, d = today()): StatusGelombang => {
  if (g.status === "sembunyi") return "sembunyi";
  const t: StatusGelombang = d < g.mulai ? "akan" : d > g.selesai ? "selesai" : "dibuka";
  return g.status === "ditutup" && t !== "selesai" ? "ditutup" : t;
};
/** Urutan tampil: nomor urut dari panitia, lalu tanggal buka. */
export const urutkanGelombang = <T extends Pick<Gelombang, "mulai" | "urutan">>(list: T[]): T[] =>
  [...list].sort((a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER) || a.mulai.localeCompare(b.mulai));
/** Gelombang yang tampil di beranda, sesuai urutan panitia. */
export const gelombangBeranda = (list: Gelombang[]) => urutkanGelombang(list.filter((g) => g.status !== "sembunyi"));
export const fmtTgl = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export function useGelombang(ta: string) {
  const [list, setList] = useState<Gelombang[]>([]);
  useEffect(() => {
    supabase.from("gelombang").select("*").eq("tahun_ajaran", ta).order("mulai").then(({ data }) => setList(gelombangBeranda((data ?? []) as Gelombang[])));
  }, [ta]);
  return list;
}

export const gelombangBentrok = (list: Gelombang[], g: { id?: string; mulai: string; selesai: string }) =>
  list.filter((x) => x.id !== g.id && g.mulai <= x.selesai && g.selesai >= x.mulai);

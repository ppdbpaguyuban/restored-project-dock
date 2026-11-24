import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import type { Pengaturan } from "@/lib/tahun";
import imgOto from "@/assets/galeri-otomotif.jpg";
import imgPplg from "@/assets/galeri-pplg.jpg";
import imgBrf from "@/assets/galeri-broadcast.jpg";
import imgHeader from "@/assets/foto-siswa-hero.jpg";
import { LOGO_RESMI } from "@/components/Logo";

type Key = "logo_url" | "header_url" | "foto_tkr" | "foto_tsm" | "foto_totr" | "foto_rpl" | "foto_bdf";
const ITEMS: { k: Key; l: string; def?: string; edge: number }[] = [
  { k: "logo_url", l: "Logo Sekolah", def: LOGO_RESMI, edge: 512 },
  { k: "header_url", l: "Foto Kegiatan Siswa di Header Beranda", def: imgHeader, edge: 1920 },
  { k: "foto_tkr", l: "Foto Teknik Kendaraan Ringan", def: imgOto, edge: 1600 },
  { k: "foto_tsm", l: "Foto Teknik Sepeda Motor", def: imgOto, edge: 1600 },
  { k: "foto_totr", l: "Foto Teknik Ototronik", def: imgOto, edge: 1600 },
  { k: "foto_rpl", l: "Foto Rekayasa Perangkat Lunak", def: imgPplg, edge: 1600 },
  { k: "foto_bdf", l: "Foto Broadcasting dan Perfilman", def: imgBrf, edge: 1600 },
];
const MAX = 5 * 1024 * 1024;

export function AsetManager({ cfg, onSimpan }: { cfg: Pengaturan | null; onSimpan: (p: Partial<Pengaturan>) => Promise<string | null> }) {
  const [url, setUrl] = useState<Partial<Record<Key, string | null>>>({});
  const [busy, setBusy] = useState<Key | null>(null);
  const [msg, setMsg] = useState<Partial<Record<Key, { ok: boolean; t: string }>>>({});
  const cur = (k: Key) => (k in url ? url[k] : cfg?.[k]) || null;

  const simpan = async (k: Key, v: string | null) => {
    const e = await onSimpan({ [k]: v } as Partial<Pengaturan>);
    if (e) throw new Error(/column|schema cache/i.test(e) ? "Kolom belum ada — jalankan bagian Logo & Galeri di kelola.sql." : e);
    setUrl((s) => ({ ...s, [k]: v }));
  };

  const unggah = async (k: Key, f: File | undefined, edge: number) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setMsg((m) => ({ ...m, [k]: { ok: false, t: "Format harus JPG, PNG, atau WebP." } }));
    if (f.size > MAX * 2) return setMsg((m) => ({ ...m, [k]: { ok: false, t: "Ukuran gambar maksimal 10 MB." } }));
    setBusy(k); setMsg((m) => ({ ...m, [k]: undefined }));
    try {
      const c = f.type === "image/png" && k === "logo_url" ? f : await compressImage(f, edge, 0.82);
      const ext = c.type === "image/png" ? "png" : "webp";
      const path = `${k}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("aset").upload(path, c, { contentType: c.type, upsert: true });
      if (error) throw new Error(/bucket/i.test(error.message) ? "Tempat penyimpanan 'aset' belum dibuat — jalankan kelola.sql." : /row-level|policy|permission/i.test(error.message) ? "Akun Anda belum terdaftar sebagai pengelola." : error.message);
      const pub = supabase.storage.from("aset").getPublicUrl(path).data.publicUrl;
      await simpan(k, pub);
      setMsg((m) => ({ ...m, [k]: { ok: true, t: "Tersimpan dan tampil di halaman publik." } }));
    } catch (e) {
      setMsg((m) => ({ ...m, [k]: { ok: false, t: `Gagal: ${(e as Error).message}` } }));
    } finally { setBusy(null); }
  };

  const reset = async (k: Key) => {
    setBusy(k);
    try { await simpan(k, null); setMsg((m) => ({ ...m, [k]: { ok: true, t: "Dikembalikan ke gambar bawaan." } })); }
    catch (e) { setMsg((m) => ({ ...m, [k]: { ok: false, t: `Gagal: ${(e as Error).message}` } })); }
    finally { setBusy(null); }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {ITEMS.map((it) => {
        const src = cur(it.k) || it.def;
        const m = msg[it.k];
        return (
          <div key={it.k} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg font-semibold">{it.l}</h3>
            <div className={`mt-3 flex items-center justify-center overflow-hidden rounded-xl bg-muted ${it.k === "logo_url" ? "h-40" : "aspect-[16/10]"}`}>
              {src ? <img src={src} alt={it.l} className={it.k === "logo_url" ? "h-32 w-32 object-contain" : "h-full w-full object-cover"} /> : <p className="text-sm text-muted-foreground">Memakai logo bawaan</p>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{cur(it.k) ? "Memakai gambar unggahan." : it.k === "logo_url" ? "Memakai logo resmi SMK Muhammadiyah 1 Paguyangan." : "Memakai gambar bawaan."} JPG/PNG/WebP, dikompres otomatis.{it.k === "logo_url" ? " Disarankan PNG transparan persegi." : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={`cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ${busy ? "pointer-events-none opacity-60" : ""}`}>
                {busy === it.k ? "Mengunggah…" : cur(it.k) ? "Ganti Gambar" : "Unggah Gambar"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { unggah(it.k, e.target.files?.[0], it.edge); e.target.value = ""; }} />
              </label>
              {cur(it.k) && <button disabled={!!busy} onClick={() => reset(it.k)} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-60">Kembalikan Bawaan</button>}
            </div>
            {m && <p role="status" className={`mt-2 text-sm ${m.ok ? "text-primary" : "text-destructive"}`}>{m.t}</p>}
          </div>
        );
      })}
    </div>
  );
}

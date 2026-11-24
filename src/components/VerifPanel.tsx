import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DOC_TAMPIL, NISN_URL, TEMPLATE_WA, waLink, type Level } from "@/lib/verifikasi";

type Verif = Record<string, boolean>;
type R = Record<string, unknown> & { id: string; nama: string; nisn: string; no_hp: string; jurusan: string; asal_sekolah: string; status: string | null };
const LABEL: Record<string, string> = { foto: "Pas Foto", kk: "Kartu Keluarga", akta: "Akta Kelahiran", skl: "SKL / Rapor", kip: "KIP / KKS / PKH" };

export const BADGE: Record<Level, [string, string]> = {
  siap: ["Siap verifikasi", "bg-primary/10 text-primary border-primary/30"],
  perhatian: ["Perlu perhatian", "bg-accent/20 text-foreground border-accent"],
  fiktif: ["Potensi fiktif", "bg-destructive/10 text-destructive border-destructive/30"],
};

export function VerifPanel({ r, cek, peringatan, level, petugas, statusList, onClose, onSave, pos, onPrev, onNext, onCetak }: {
  r: R; cek: string[]; peringatan: string[]; level: Level; petugas: string; statusList: string[];
  onClose: () => void; onSave: (v: Verif, catatan: string, status: string) => Promise<void>;
  pos?: string | undefined; onPrev?: (() => void) | undefined; onNext?: (() => void) | undefined; onCetak?: () => void;
}) {
  const [v, setV] = useState<Verif>((r["verifikasi"] as Verif) ?? {});
  const [catatan, setCatatan] = useState(String(r["catatan"] ?? ""));
  const [status, setStatus] = useState(r.status ?? "baru");
  const docs = DOC_TAMPIL.filter((k) => r[`berkas_${k}`]);
  const [doc, setDoc] = useState<string>(docs[0] ?? "");
  const [url, setUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [busy, setBusy] = useState(false);
  const path = doc ? String(r[`berkas_${doc}`]) : "";
  const pdf = path.endsWith(".pdf");
  type Log = { id: string; oleh: string | null; aksi: string; dari: string | null; ke: string | null; created_at: string };
  const [riwayat, setRiwayat] = useState<Log[] | null>(null);
  const [riwayatErr, setRiwayatErr] = useState("");
  useEffect(() => {
    supabase.from("pendaftar_riwayat").select("*").eq("pendaftar_id", r.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data, error }) => { if (error) setRiwayatErr(/relation|schema cache|does not exist/i.test(error.message) ? "Riwayat belum aktif. Jalankan bagian terbaru kelola.sql." : "Gagal memuat riwayat."); else setRiwayat((data ?? []) as Log[]); });
  }, [r.id]);
  const jelas = (l: Log) => l.aksi === "status" ? `Status: ${l.dari ?? "-"} → ${l.ke ?? "-"}` : l.aksi === "checklist" ? `Checklist: ${l.dari ?? 0} → ${l.ke ?? 0} tercentang` : l.ke ? `Catatan: “${l.ke}”` : "Catatan dihapus";

  useEffect(() => {
    setUrl(""); setZoom(1); setRot(0);
    if (!path) return;
    supabase.storage.from("berkas").createSignedUrl(path, 600).then(({ data }) => setUrl(data?.signedUrl ?? "error"));
  }, [path]);

  const [lb, cls] = BADGE[level];
  const wa = (t: string) => window.open(waLink(r.no_hp, t), "_blank");
  const btn = "rounded-full border border-border px-3 py-1.5 text-xs";

  return (
    <div className="fixed inset-0 z-30 flex items-stretch justify-center bg-foreground/50 sm:p-4" onClick={onClose}>
      <div className="flex w-full max-w-6xl flex-col overflow-hidden bg-card sm:rounded-2xl lg:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-h-[35vh] flex-1 flex-col border-b border-border bg-muted lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            {docs.map((k) => <button key={k} onClick={() => setDoc(k)} className={`rounded-full px-3 py-1 text-xs ${doc === k ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>{LABEL[k]}</button>)}
            {!docs.length && <span className="px-2 text-xs text-muted-foreground">Tidak ada berkas diunggah.</span>}
            {doc && !pdf && <div className="ml-auto flex gap-1">
              <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className={btn} aria-label="Perkecil">−</button>
              <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className={btn} aria-label="Perbesar">+</button>
              <button onClick={() => setRot((x) => (x + 90) % 360)} className={btn}>Putar</button>
            </div>}
            {url && url !== "error" && <a href={url} target="_blank" rel="noreferrer" className={`${btn} ${pdf ? "ml-auto" : ""}`}>Buka tab baru</a>}
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-3">
            {!doc ? null : !url ? <p className="text-sm text-muted-foreground">Memuat berkas…</p> : url === "error" ? <p className="text-sm text-destructive">Berkas tidak bisa dibuka.</p>
              : pdf ? <iframe src={url} title={LABEL[doc]} className="h-[60vh] w-full rounded bg-background" />
              : <img src={url} alt={LABEL[doc]} style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }} className="max-h-[70vh] max-w-full object-contain transition-transform" />}
          </div>
        </div>

        <div className="w-full overflow-y-auto p-4 pb-8 sm:p-5 lg:max-w-sm">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="font-display text-lg font-semibold">{r.nama}</h3><span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{lb}</span></div>
            <button onClick={onClose} className="text-xl leading-none text-muted-foreground" aria-label="Tutup">×</button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button disabled={!onPrev} onClick={onPrev} className={`${btn} disabled:opacity-40`}>← Sebelumnya</button>
            {pos && <span className="text-xs text-muted-foreground">{pos}</span>}
            <button disabled={!onNext} onClick={onNext} className={`${btn} disabled:opacity-40`}>Berikutnya →</button>
          </div>
          {peringatan.length > 0 && <ul className="mt-3 list-disc rounded-lg border border-border bg-muted p-3 pl-6 text-xs">{peringatan.map((p) => <li key={p}>{p}</li>)}</ul>}
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">NISN</dt><dd className="flex flex-wrap items-center gap-2">{r.nisn}<button onClick={() => { navigator.clipboard?.writeText(r.nisn); window.open(NISN_URL, "_blank"); }} className="text-xs text-primary underline">Cek NISN resmi</button></dd>
            <dt className="text-muted-foreground">Lahir</dt><dd>{String(r["tanggal_lahir"] ?? "-")}</dd>
            <dt className="text-muted-foreground">Jenis kelamin</dt><dd>{String(r["jenis_kelamin"] || "-")}</dd>
            <dt className="text-muted-foreground">Agama</dt><dd>{String(r["agama"] || "-")}</dd>
            <dt className="text-muted-foreground">HP</dt><dd>{r.no_hp}</dd>
            <dt className="text-muted-foreground">Asal</dt><dd>{r.asal_sekolah}</dd>
            <dt className="text-muted-foreground">Kota sekolah</dt><dd>{String(r["kota_sekolah"] || "-")}</dd>
            <dt className="text-muted-foreground">Tahun lulus</dt><dd>{String(r["tahun_lulus"] || "-")}</dd>
            <dt className="text-muted-foreground">Jurusan</dt><dd>{r.jurusan}</dd>
            <dt className="text-muted-foreground">Jurusan 2</dt><dd>{String(r["jurusan_2"] || "-")}</dd>
            <dt className="text-muted-foreground">Alamat</dt><dd>{String(r["alamat"] ?? "-")}</dd>
          </dl>
          <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold uppercase text-muted-foreground">Checklist</p><button onClick={() => setV(Object.fromEntries(cek.map((c) => [c, true])))} className="text-xs text-primary underline">Centang semua</button></div>
          <div className="mt-2 grid gap-2">{cek.map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!v[c]} onChange={(e) => setV({ ...v, [c]: e.target.checked })} /> {c}</label>)}</div>
          <label className="mt-4 block text-xs font-semibold uppercase text-muted-foreground">Catatan petugas / alasan perbaikan</label>
          <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} maxLength={500} placeholder="Contoh: KK foto buram" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <label className="mt-3 block text-xs font-semibold uppercase text-muted-foreground">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{statusList.map((s) => <option key={s}>{s}</option>)}</select>
          <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Kirim WhatsApp</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => wa(TEMPLATE_WA.lengkap(r.nama))} className={btn}>Berkas lengkap</button>
            <button onClick={() => wa(TEMPLATE_WA.perbaikan(r.nama, catatan))} className={btn}>Minta perbaikan</button>
            <button onClick={() => wa(TEMPLATE_WA.diterima(r.nama, r.jurusan))} className={btn}>Diterima</button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Petugas: <b>{petugas || "-"}</b>{r["diverifikasi_at"] ? ` · terakhir ${new Date(String(r["diverifikasi_at"])).toLocaleString("id-ID")}` : ""}</p>
          <p className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Riwayat perubahan</p>
          {riwayatErr ? <p className="mt-2 text-xs text-destructive">{riwayatErr}</p> : !riwayat ? <p className="mt-2 text-xs text-muted-foreground">Memuat…</p> : !riwayat.length ? <p className="mt-2 text-xs text-muted-foreground">Belum ada perubahan tercatat.</p> : (
            <ol className="mt-2 grid max-h-56 gap-2 overflow-y-auto border-l border-border pl-3">
              {riwayat.map((l) => <li key={l.id} className="text-xs"><p className="break-words">{jelas(l)}</p><p className="text-muted-foreground">{l.oleh ?? "sistem"} · {new Date(l.created_at).toLocaleString("id-ID")}</p></li>)}
            </ol>
          )}
          <button disabled={busy} onClick={async () => { setBusy(true); await onSave(Object.fromEntries(cek.map((c) => [c, true])), catatan.trim(), "diverifikasi"); setBusy(false); }} className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">✓ Centang Semua & Loloskan</button>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {onCetak && <button onClick={onCetak} className="mr-auto rounded-full border border-border px-4 py-2 text-sm">Cetak lembar kendali</button>}
            <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Batal</button>
            <button disabled={busy} onClick={async () => { setBusy(true); await onSave(v, catatan.trim(), status); setBusy(false); }} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">{busy ? "Menyimpan…" : "Simpan"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

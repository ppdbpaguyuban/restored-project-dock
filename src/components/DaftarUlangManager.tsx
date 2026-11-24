import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ITEM_DEFAULT, LABEL_BAYAR, rapikanDU, rupiah, sinkronDU, sisaBiaya, statusBayarDU, totalBiaya, type DaftarUlang } from "@/lib/daftar-ulang";

type P = { id: string; nama: string; jurusan: string; status: string | null; no_daftar?: string | null; daftar_ulang?: DaftarUlang | null };
const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function DaftarUlangManager({ list, onUpdate }: { list: P[]; onUpdate: (id: string, patch: Partial<P>) => void }) {
  const [f, setF] = useState<"diterima" | "semua">("diterima");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<P | null>(null);
  const rows = list.filter((x) => (f === "semua" || x.status === "diterima") && (!q || `${x.nama} ${x.no_daftar ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-xl font-semibold">Daftar Ulang</h2>
      <p className="mt-1 text-sm text-muted-foreground">Isi rincian biaya untuk siswa yang diterima. Rincian tampil di halaman Cek Status.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / no. daftar" className={`${inputCls} max-w-xs`} />
        {(["diterima", "semua"] as const).map((k) => (
          <button key={k} onClick={() => setF(k)} className={`rounded-full px-4 py-1.5 text-sm ${f === k ? "bg-foreground text-background" : "border border-border"}`}>{k === "diterima" ? "Sudah diterima" : "Semua pendaftar"}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {rows.length === 0 && <li className="text-sm text-muted-foreground">Belum ada pendaftar {f === "diterima" ? "berstatus diterima" : ""}.</li>}
        {rows.map((x) => {
          const du = x.daftar_ulang;
          return (
            <li key={x.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium">{x.nama}</p><p className="text-xs text-muted-foreground">{x.jurusan} · {x.no_daftar ?? "-"} · {x.status ?? "baru"}</p></div>
              <span className="text-xs">{du?.items?.length ? `${rupiah(totalBiaya(du))} · ${LABEL_BAYAR[statusBayarDU(du)]}` : "Rincian belum diisi"}</span>
              <button onClick={() => setEdit(x)} className="rounded-full bg-foreground px-4 py-1.5 text-xs text-background">Atur</button>
            </li>
          );
        })}
      </ul>
      {edit && <Editor p={edit} onClose={() => setEdit(null)} onSaved={(patch) => { onUpdate(edit.id, patch); setEdit(null); }} />}
    </section>
  );
}

function Editor({ p, onClose, onSaved }: { p: P; onClose: () => void; onSaved: (patch: Partial<P>) => void }) {
  const [d, setRaw] = useState<DaftarUlang>(() => sinkronDU(p.daftar_ulang?.items ? p.daftar_ulang : { items: ITEM_DEFAULT }));
  const setD = (n: DaftarUlang) => setRaw(sinkronDU(n));
  const sb = statusBayarDU(d);
  const [terima, setTerima] = useState(p.status === "diterima");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const setItem = (i: number, k: "nama" | "nominal", v: string) => setD({ ...d, items: d.items.map((it, j) => (j === i ? { ...it, [k]: k === "nominal" ? Number(v.replace(/\D/g, "")) : v } : it)) });
  async function simpan() {
    setBusy(true); setErr("");
    const du = rapikanDU(d);
    const patch: Partial<P> = { daftar_ulang: du, ...(terima ? { status: "diterima" } : p.status === "diterima" ? { status: "diverifikasi" } : {}) };
    const { error } = await supabase.from("pendaftar").update(patch as never).eq("id", p.id);
    setBusy(false);
    if (error) return setErr(/daftar_ulang/.test(error.message) ? "Kolom daftar ulang belum ada. Jalankan ulang supabase/kelola.sql di SQL Editor." : "Gagal menyimpan: " + error.message);
    onSaved(patch);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2"><div><h3 className="font-display text-lg font-semibold">{p.nama}</h3><p className="text-xs text-muted-foreground">{p.jurusan} · {p.no_daftar}</p></div><button onClick={onClose} aria-label="Tutup" className="text-xl">×</button></div>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium"><input type="checkbox" checked={terima} onChange={(e) => setTerima(e.target.checked)} /> Status: Diterima</label>
        <p className="mt-4 text-sm font-semibold">Rincian biaya</p>
        <div className="mt-2 grid gap-2">
          {d.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input value={it.nama} onChange={(e) => setItem(i, "nama", e.target.value)} placeholder="Nama biaya" className={inputCls} />
              <input value={it.nominal ? it.nominal.toLocaleString("id-ID") : ""} onChange={(e) => setItem(i, "nominal", e.target.value)} inputMode="numeric" placeholder="0" className={`${inputCls} max-w-[130px] text-right`} />
              <button onClick={() => setD({ ...d, items: d.items.filter((_, j) => j !== i) })} aria-label="Hapus baris" className="px-2 text-muted-foreground">×</button>
            </div>
          ))}
          <button onClick={() => setD({ ...d, items: [...d.items, { nama: "", nominal: 0 }] })} className="justify-self-start rounded-full border border-border px-3 py-1 text-xs">+ Tambah biaya</button>
        </div>
        <p className="mt-3 text-right text-sm">Total: <b>{rupiah(totalBiaya(d))}</b></p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1 text-xs">Status bayar
            <p aria-label="Status bayar" aria-live="polite" className={`${inputCls} bg-muted font-medium`}>{LABEL_BAYAR[sb]}</p>
            <span className="text-[11px] text-muted-foreground">Otomatis dari nominal Sudah dibayar</span></div>
          <label className="grid gap-1 text-xs">Sudah dibayar (Rp)
            <input value={d.dibayar ? d.dibayar.toLocaleString("id-ID") : ""} onChange={(e) => setD({ ...d, dibayar: Number(e.target.value.replace(/\D/g, "")) })} inputMode="numeric" placeholder="0" className={inputCls} /></label>
          <label className="grid gap-1 text-xs">Batas daftar ulang
            <input type="date" value={d.batas ?? ""} onChange={(e) => setD({ ...d, batas: e.target.value })} className={inputCls} /></label>
          <p className="self-end text-xs text-muted-foreground">Sisa: <b className="text-foreground">{rupiah(sisaBiaya(d))}</b></p>
        </div>
        <label className="mt-3 grid gap-1 text-xs">Catatan / cara bayar
          <textarea value={d.catatan ?? ""} onChange={(e) => setD({ ...d, catatan: e.target.value })} rows={3} placeholder="Contoh: Bayar di ruang TU pukul 08.00–12.00, bawa bukti cetak ini." className={inputCls} /></label>
        {err && <p role="alert" className="mt-3 text-sm text-destructive">{err}</p>}
        <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Batal</button><button disabled={busy} onClick={simpan} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-60">{busy ? "Menyimpan…" : "Simpan"}</button></div>
      </div>
    </div>
  );
}

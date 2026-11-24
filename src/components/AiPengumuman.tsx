import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { susunPengumumanAI } from "@/lib/pengumuman-ai.functions";
import { MAKS_DRAF, NADA_PENGUMUMAN, validasiDraf, type NadaPengumuman } from "@/lib/pengumuman-ai";

const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:border-primary";

export function AiPengumuman({ tahunAjaran, onPakai }: { tahunAjaran?: string | undefined; onPakai: (teks: string) => void }) {
  const susun = useServerFn(susunPengumumanAI);
  const [buka, setBuka] = useState(false);
  const [draf, setDraf] = useState("");
  const [nada, setNada] = useState<NadaPengumuman>("resmi");
  const [hasil, setHasil] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function jalankan() {
    const salah = validasiDraf(draf);
    if (salah) return setErr(salah);
    setBusy(true); setErr("");
    try {
      const r = await susun({ data: { draf, nada, ...(tahunAjaran ? { tahunAjaran } : {}) } });
      if (r.error) setErr(r.error); else setHasil(r.teks ?? "");
    } catch {
      setErr("Gagal menghubungi AI. Periksa koneksi lalu coba lagi.");
    } finally { setBusy(false); }
  }

  if (!buka) return (
    <button type="button" onClick={() => setBuka(true)} className="w-fit rounded-full border border-primary px-4 py-1.5 text-sm text-primary hover:bg-primary/10">
      ✨ Susun dengan AI dari draf/poin
    </button>
  );

  return (
    <div className="grid gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">✨ Asisten Pengumuman AI</p>
        <button type="button" onClick={() => setBuka(false)} className="text-xs text-muted-foreground underline">Tutup</button>
      </div>
      <p className="text-xs text-muted-foreground">Tulis poin-poin atau draf kasar. AI akan menyusunnya menjadi pengumuman yang rapi. Periksa kembali hasilnya sebelum dipakai.</p>
      <textarea
        aria-label="Draf atau poin pengumuman"
        value={draf} onChange={(e) => setDraf(e.target.value)} rows={4} maxLength={MAKS_DRAF}
        placeholder={"Contoh:\n- gelombang 2 dibuka 1 Des – 31 Jan\n- bawa fotokopi KK & ijazah\n- info: WA panitia 0812xxxx"}
        className={inputCls}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Gaya:</span>
        {(Object.keys(NADA_PENGUMUMAN) as NadaPengumuman[]).map((k) => (
          <button key={k} type="button" onClick={() => setNada(k)} className={`rounded-full border px-3 py-1 text-xs ${nada === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{NADA_PENGUMUMAN[k]}</button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{draf.length}/{MAKS_DRAF}</span>
      </div>
      {err && <p role="alert" className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      <button type="button" disabled={busy} onClick={jalankan} className="w-fit rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">
        {busy ? "Menyusun…" : hasil ? "Susun ulang" : "Susun pengumuman"}
      </button>
      {hasil && (
        <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold text-muted-foreground">Hasil AI</p>
          <p className="whitespace-pre-line text-sm" data-testid="hasil-ai">{hasil}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onPakai(hasil)} className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Pakai hasil ini</button>
            <button type="button" onClick={() => setHasil("")} className="rounded-full border border-border px-4 py-1.5 text-sm">Buang</button>
          </div>
          <p className="text-xs text-muted-foreground">"Pakai" mengisi kolom pengumuman & pratinjau. Tekan "Simpan pengumuman" untuk menayangkannya.</p>
        </div>
      )}
    </div>
  );
}

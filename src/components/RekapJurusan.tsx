import { rekapJurusan, type BarisRekap } from "@/lib/rekap";

export function RekapJurusanPanel({ rows, cek, aktif, onLihat, onIsiChecklist }: {
  rows: BarisRekap[]; cek: readonly string[]; aktif: string;
  onLihat: (jurusan: string) => void; onIsiChecklist: (jurusan: string) => void;
}) {
  const rekap = rekapJurusan(rows, cek);
  const total = rekap.reduce((a, r) => ({ t: a.t + r.total, l: a.l + r.lengkap, d: a.d + r.diterima }), { t: 0, l: 0, d: 0 });
  return (
    <section aria-label="Rekap per jurusan" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Rekap per Jurusan</h2>
        <p className="text-sm text-muted-foreground">Total {total.t} pendaftar · checklist lengkap {total.l} · diterima {total.d}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rekap.map((r) => {
          const pct = r.total ? Math.round((r.lengkap / r.total) * 100) : 0;
          return (
            <article key={r.jurusan} className={`grid gap-2 rounded-xl border p-3 ${aktif === r.jurusan ? "border-foreground/30 ring-1 ring-foreground/30" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-foreground">{r.kode}</p>
                  <p className="truncate text-sm font-medium" title={r.jurusan}>{r.jurusan}</p>
                </div>
                <p className="font-display text-3xl font-semibold leading-none" aria-label={`${r.total} pendaftar`}>{r.total}</p>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <span className="rounded-full bg-muted px-2 py-0.5">Belum diverifikasi {r.baru}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">Diverifikasi {r.diverifikasi}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">Diterima {r.diterima}</span>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Ditolak {r.ditolak}</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground"><span>Checklist lengkap</span><span>{r.lengkap}/{r.total}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onLihat(r.jurusan)} disabled={!r.total} className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-50">{aktif === r.jurusan ? "Tampilkan semua" : "Lihat daftar"}</button>
                <button type="button" onClick={() => onIsiChecklist(r.jurusan)} disabled={!r.perluCek} className="rounded-full bg-foreground px-3 py-1 text-xs text-background disabled:opacity-50">
                  {r.perluCek ? `Isi checklist (${r.perluCek})` : "Checklist beres ✓"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

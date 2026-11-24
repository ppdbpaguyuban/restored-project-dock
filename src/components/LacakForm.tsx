import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { LABEL_BAYAR, rupiah, sisaBiaya, totalBiaya } from "@/lib/daftar-ulang";
import { CEK_VERIFIKASI, LABEL_STATUS, formatNoValid, fungsiLacakBelumAda, rapikanNo, tahapan, type HasilLacak, type Keadaan } from "@/lib/lacak";

const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary";
const fmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");

export function LacakForm({ awal = "" }: { awal?: string }) {
  const [no, setNo] = useState(awal);
  const [tgl, setTgl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hasil, setHasil] = useState<HasilLacak | null>(null);
  useEffect(() => { if (awal) setNo(awal); }, [awal]);

  async function cari(e: FormEvent) {
    e.preventDefault();
    setErr(""); setHasil(null);
    const n = rapikanNo(no);
    if (!formatNoValid(n)) return setErr("Format nomor tidak sesuai. Contoh: PPDB-2728-RPL-7KQ4XM");
    if (!tgl) return setErr("Isi tanggal lahir sesuai formulir pendaftaran.");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("lacak_pendaftaran", { p_no: n, p_tgl: tgl });
      if (error) {
        setErr(fungsiLacakBelumAda(`${error.code ?? ""} ${error.message}`) ? "Layanan cek status belum diaktifkan panitia. Silakan hubungi panitia PPDB." : "Gagal memeriksa status. Coba lagi beberapa saat.");
        return;
      }
      const row = (Array.isArray(data) ? data[0] : data) as HasilLacak | undefined;
      if (!row) setErr("Data tidak ditemukan. Pastikan nomor pendaftaran dan tanggal lahir sama seperti saat mendaftar.");
      else setHasil(row);
    } catch {
      setErr("Koneksi internet bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={cari} className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6" noValidate>
        <label className="grid gap-1 text-sm font-medium">Nomor pendaftaran
          <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="PPDB-2728-RPL-7KQ4XM" autoCapitalize="characters" autoComplete="off" spellCheck={false} className={`${inputCls} font-mono uppercase`} />
        </label>
        <label className="grid gap-1 text-sm font-medium">Tanggal lahir calon siswa
          <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} className={inputCls} />
        </label>
        <p className="text-xs text-muted-foreground">Tanggal lahir dipakai sebagai pengaman agar status hanya bisa dilihat oleh pendaftar sendiri.</p>
        {err && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-primary px-6 font-medium text-primary-foreground disabled:opacity-60">{busy ? "Memeriksa…" : "Cek Status"}</button>
      </form>
      {hasil && <Hasil h={hasil} />}
    </div>
  );
}

const IKON: Record<Keadaan, [string, string]> = {
  selesai: ["✓", "bg-primary text-primary-foreground"],
  berjalan: ["•", "bg-sun text-sun-foreground pulse-dot"],
  menunggu: ["", "border-2 border-border bg-card"],
  gagal: ["×", "bg-destructive text-destructive-foreground"],
};

function Hasil({ h }: { h: HasilLacak }) {
  const st = h.status ?? "baru";
  const tahap = tahapan(h);
  const v = h.verifikasi ?? {};
  const warna = st === "diterima" ? "bg-cheer text-primary-foreground" : st === "ditolak" ? "bg-destructive/10 text-destructive" : "bg-mint";
  return (
    <section aria-label="Hasil cek status" className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={`p-4 sm:p-6 ${warna}`}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Status pendaftaran</p>
        <p className="mt-1 font-display text-2xl font-bold">{LABEL_STATUS[st] ?? st}</p>
        <p className="mt-2 break-words font-mono text-sm">{h.no_daftar}</p>
      </div>
      <dl className="grid gap-x-4 gap-y-2 border-b border-border p-4 text-sm sm:grid-cols-2 sm:p-6">
        {([["Nama", h.nama], ["Jurusan", h.jurusan], ...(h.gelombang ? [["Gelombang", h.gelombang]] : []), ...(h.tahun_ajaran ? [["Tahun ajaran", h.tahun_ajaran]] : [])] as [string, string][]).map(([k, val]) => (
          <div key={k} className="flex justify-between gap-3 sm:block"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium sm:text-left">{val}</dd></div>
        ))}
      </dl>
      <div className="p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Progres</h2>
        <ol className="mt-4 grid gap-0">
          {tahap.map((t, i) => (
            <li key={t.judul} className="relative flex gap-3 pb-5 last:pb-0">
              {i < tahap.length - 1 && <span aria-hidden className="absolute left-4 top-8 h-[calc(100%-2rem)] w-0.5 bg-border" />}
              <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${IKON[t.keadaan][1]}`} aria-hidden>{IKON[t.keadaan][0]}</span>
              <div className="min-w-0 pt-1">
                <p className={`font-medium ${t.keadaan === "menunggu" ? "text-muted-foreground" : ""}`}>{t.judul}{t.tanggal ? <span className="ml-2 text-xs font-normal text-muted-foreground">{fmt(t.tanggal)}</span> : null}</p>
                <p className="text-sm text-muted-foreground">{t.ket}</p>
              </div>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 text-sm font-semibold">Pemeriksaan berkas oleh panitia</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {CEK_VERIFIKASI.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${v[c] ? "bg-primary text-primary-foreground" : "border border-border"}`} aria-hidden>{v[c] ? "✓" : ""}</span>
              <span className="min-w-0 flex-1">{c}</span>
              <span className={`text-xs ${v[c] ? "text-primary" : "text-muted-foreground"}`}>{v[c] ? "Sesuai" : "Belum diperiksa"}</span>
            </li>
          ))}
        </ul>
      </div>
      {st === "diterima" && <DaftarUlangInfo h={h} />}
    </section>
  );
}

function DaftarUlangInfo({ h }: { h: HasilLacak }) {
  const d = h.daftar_ulang;
  if (!d?.items?.length) return <div className="border-t border-border p-4 text-sm text-muted-foreground sm:p-6">Rincian biaya daftar ulang akan diumumkan panitia.</div>;
  const sb = d.status_bayar ?? "belum";
  return (
    <div className="border-t border-border p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Rincian Biaya Daftar Ulang</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sb === "lunas" ? "bg-primary text-primary-foreground" : "bg-sun text-sun-foreground"}`}>{LABEL_BAYAR[sb]}</span>
      </div>
      <table className="mt-3 w-full text-sm"><tbody>
        {d.items.map((i) => <tr key={i.nama} className="border-b border-border"><td className="py-2">{i.nama}</td><td className="py-2 text-right">{rupiah(i.nominal)}</td></tr>)}
        <tr><td className="py-2 font-semibold">Total</td><td className="py-2 text-right font-semibold">{rupiah(totalBiaya(d))}</td></tr>
        {sb !== "lunas" && !!d.dibayar && <tr><td className="text-muted-foreground">Sudah dibayar</td><td className="text-right text-muted-foreground">{rupiah(d.dibayar)}</td></tr>}
        {sb !== "lunas" && <tr><td className="py-1 font-semibold">Sisa</td><td className="py-1 text-right font-semibold">{rupiah(sisaBiaya(d))}</td></tr>}
      </tbody></table>
      {d.batas && <p className="mt-3 text-sm">Batas daftar ulang: <b>{fmt(d.batas)}</b></p>}
      {d.catatan && <p className="mt-2 whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{d.catatan}</p>}
    </div>
  );
}

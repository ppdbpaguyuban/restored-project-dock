import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase";
import { AiPengumuman } from "@/components/AiPengumuman";
import { EditorWysiwyg, KontenKaya } from "@/components/EditorWysiwyg";
import { teksPolos } from "@/lib/konten";
import { fmtTgl, statusGelombang, gelombangBentrok, urutkanGelombang, type AturGelombang, SEKOLAH_DEFAULT, mapsEmbed, validasiProfil, MAKS_PENGUMUMAN, daftarSyarat, SYARAT_DEFAULT, type Gelombang, type Pengaturan } from "@/lib/tahun";

const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:border-foreground/40";
const btn = "rounded-full bg-foreground px-5 py-2 text-sm text-background";
const Box = ({ title, children, msg }: { title: string; children: React.ReactNode; msg: string }) => (
  <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
    <h2 className="font-display text-xl font-semibold">{title}</h2>
    {msg && <p role="status" className="mt-2 text-sm text-muted-foreground">{msg}</p>}
    <div className="mt-4 grid gap-3">{children}</div>
  </section>
);
const tableMissing = (m: string) => /schema cache|does not exist/i.test(m) ? "Tabel belum dibuat. Jalankan file supabase/kelola.sql di SQL Editor Supabase." : m;

type Faq = { id: string; pertanyaan: string; jawaban: string; urutan: number };
export function FaqManager() {
  const [list, setList] = useState<Faq[]>([]);
  const [edit, setEdit] = useState<Partial<Faq>>({});
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("faq").select("*").order("urutan");
    if (error) setMsg(tableMissing(error.message)); else setList(data as Faq[]);
  };
  useEffect(() => { load(); }, []);
  async function simpan() {
    if (!edit.pertanyaan || !edit.jawaban) return setMsg("Isi pertanyaan dan jawaban.");
    const row = { pertanyaan: edit.pertanyaan, jawaban: edit.jawaban, urutan: edit.urutan ?? list.length + 1 };
    const { error } = edit.id ? await supabase.from("faq").update(row).eq("id", edit.id) : await supabase.from("faq").insert(row);
    setMsg(error ? tableMissing(error.message) : "FAQ tersimpan."); if (!error) setEdit({}); load();
  }
  async function isiContoh() {
    const rows = [
      ["Kapan pendaftaran dibuka?", "Jadwal tiap gelombang tampil di beranda."],
      ["Berkas apa yang perlu disiapkan?", "Pas foto 3x4, Kartu Keluarga, Akta Kelahiran, dan SKL/Rapor."],
      ["Bagaimana cara cek status pendaftaran?", "Buka halaman Cek Status, masukkan nomor pendaftaran dan tanggal lahir."],
    ].map(([pertanyaan, jawaban], i) => ({ pertanyaan, jawaban, urutan: list.length + i + 1 }));
    const { error } = await supabase.from("faq").insert(rows);
    setMsg(error ? tableMissing(error.message) : "FAQ contoh ditambahkan. Silakan ubah sesuai kebutuhan."); load();
  }
  async function hapus(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    await supabase.from("faq").delete().eq("id", id); load();
  }
  return (
    <Box title="Kelola FAQ" msg={msg}>
      <input value={edit.pertanyaan ?? ""} onChange={(e) => setEdit({ ...edit, pertanyaan: e.target.value })} placeholder={(list.find((x) => x.id === edit.id) ?? list[list.length - 1])?.pertanyaan ?? "Pertanyaan"} className={inputCls} />
      <textarea value={edit.jawaban ?? ""} onChange={(e) => setEdit({ ...edit, jawaban: e.target.value })} placeholder={(list.find((x) => x.id === edit.id) ?? list[list.length - 1])?.jawaban ?? "Jawaban"} rows={3} className={inputCls} />
      <div className="flex gap-2">
        <input type="number" value={edit.urutan ?? ""} onChange={(e) => setEdit({ ...edit, urutan: Number(e.target.value) })} placeholder={String((list.find((x) => x.id === edit.id)?.urutan) ?? list.length + 1)} className={`${inputCls} max-w-[120px]`} />
        <button onClick={simpan} className={btn}>{edit.id ? "Simpan perubahan" : "Tambah FAQ"}</button>
        {!list.length && !edit.id && <button onClick={isiContoh} className="rounded-full border border-border px-5 text-sm">Isi FAQ contoh</button>}
        {edit.id && <button onClick={() => setEdit({})} className="rounded-full border border-border px-5 text-sm">Batal</button>}
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {list.map((f) => (
          <li key={f.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <div><p className="font-medium">{f.urutan}. {f.pertanyaan}</p><p className="text-muted-foreground">{f.jawaban}</p></div>
            <div className="flex shrink-0 gap-3"><button onClick={() => setEdit(f)} className="text-foreground">Ubah</button><button onClick={() => hapus(f.id)} className="text-destructive">Hapus</button></div>
          </li>
        ))}
        {!list.length && <li className="py-3 text-sm text-muted-foreground">Belum ada FAQ (situs memakai FAQ bawaan).</li>}
      </ul>
    </Box>
  );
}

export function TahunManager({ aktif, onAktifkan }: { aktif: string | undefined; onAktifkan: (t: string) => void }) {
  const [list, setList] = useState<{ id: string; nama: string }[]>([]);
  const [baru, setBaru] = useState("");
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("tahun_ajaran").select("id,nama").order("nama", { ascending: false });
    if (error) setMsg(tableMissing(error.message)); else setList(data ?? []);
  };
  useEffect(() => { load(); }, []);
  async function tambah() {
    if (!/^\d{4}\/\d{4}$/.test(baru)) return setMsg("Format tahun ajaran: 2027/2028");
    const { error } = await supabase.from("tahun_ajaran").insert({ nama: baru });
    setMsg(error ? tableMissing(error.message) : "Tahun ajaran ditambahkan."); if (!error) setBaru(""); load();
  }
  async function hapus(id: string, nama: string) {
    if (nama === aktif) return setMsg("Tahun ajaran aktif tidak bisa dihapus.");
    if (!confirm(`Hapus ${nama}?`)) return;
    await supabase.from("tahun_ajaran").delete().eq("id", id); load();
  }
  return (
    <Box title="Kelola Tahun Ajaran" msg={msg}>
      <div className="flex gap-2"><input value={baru} onChange={(e) => setBaru(e.target.value)} placeholder={list[0] ? `${+list[0].nama.slice(0, 4) + 1}/${+list[0].nama.slice(0, 4) + 2}` : "2027/2028"} className={`${inputCls} max-w-[180px]`} /><button onClick={tambah} className={btn}>Tambah</button></div>
      <ul className="divide-y divide-border border-t border-border">
        {list.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2 text-sm">
            <span className="font-medium">{t.nama} {t.nama === aktif && <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">Aktif</span>}</span>
            <div className="flex gap-3">{t.nama !== aktif && <button onClick={() => onAktifkan(t.nama)} className="text-foreground">Jadikan aktif</button>}<button onClick={() => hapus(t.id, t.nama)} className="text-destructive">Hapus</button></div>
          </li>
        ))}
        {!list.length && <li className="py-2 text-sm text-muted-foreground">Belum ada daftar tahun ajaran.</li>}
      </ul>
    </Box>
  );
}

type Pengelola = { id: string; email: string; nama: string | null; aktif: boolean };
export function PengelolaManager() {
  const [list, setList] = useState<Pengelola[]>([]);
  const [f, setF] = useState({ nama: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("pengelola").select("*").order("created_at");
    if (error) setMsg(tableMissing(error.message)); else setList(data as Pengelola[]);
  };
  useEffect(() => { load(); }, []);
  async function tambah() {
    if (!f.email.includes("@") || f.password.length < 6) return setMsg("Isi email valid dan password minimal 6 karakter.");
    // Separate client so the admin's own session is not replaced.
    const temp = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: e1 } = await temp.auth.signUp({ email: f.email, password: f.password });
    if (e1 && !/already/i.test(e1.message)) return setMsg("Gagal membuat akun: " + e1.message);
    const { error } = await supabase.from("pengelola").upsert({ email: f.email, nama: f.nama || null, aktif: true }, { onConflict: "email" });
    setMsg(error ? tableMissing(error.message) : "Pengelola ditambahkan. Jika Supabase mewajibkan konfirmasi email, konfirmasi akun di Authentication → Users.");
    if (!error) setF({ nama: "", email: "", password: "" }); load();
  }
  async function toggle(p: Pengelola) { await supabase.from("pengelola").update({ aktif: !p.aktif }).eq("id", p.id); load(); }
  async function hapus(p: Pengelola) { if (confirm(`Hapus ${p.email} dari daftar?`)) { await supabase.from("pengelola").delete().eq("id", p.id); load(); } }
  return (
    <Box title="Kelola User Pengelola" msg={msg}>
      <div className="grid gap-2 md:grid-cols-3">
        <input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder={list[list.length - 1]?.nama ?? "Nama"} className={inputCls} />
        <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={inputCls} />
        <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} type="password" placeholder="Password" className={inputCls} />
      </div>
      <button onClick={tambah} className={`${btn} w-fit`}>Tambah pengelola</button>
      <ul className="divide-y divide-border border-t border-border">
        {list.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2 text-sm">
            <span><b>{p.nama || "-"}</b> · {p.email} {!p.aktif && <span className="text-destructive">(nonaktif)</span>}</span>
            <div className="flex gap-3"><button onClick={() => toggle(p)} className="text-foreground">{p.aktif ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => hapus(p)} className="text-destructive">Hapus</button></div>
          </li>
        ))}
        {!list.length && <li className="py-2 text-sm text-muted-foreground">Belum ada pengelola tambahan.</li>}
      </ul>
    </Box>
  );
}

const STATUS_LABEL = { akan: "Akan datang", dibuka: "Sedang dibuka", selesai: "Selesai", ditutup: "Ditutup sementara", sembunyi: "Disembunyikan" } as const;
const STATUS_CLS = { akan: "bg-secondary text-secondary-foreground", dibuka: "bg-foreground text-background", selesai: "bg-muted text-muted-foreground", ditutup: "bg-destructive/10 text-destructive", sembunyi: "border border-dashed border-border text-muted-foreground" } as const;
const ATUR: [AturGelombang, string][] = [["otomatis", "Otomatis (ikut tanggal)"], ["ditutup", "Ditutup sementara"], ["sembunyi", "Sembunyikan dari beranda"]];
const kolomBaruBelumAda = (m: string) => /(urutan|status)/i.test(m) && /column|schema cache|does not exist/i.test(m);
const PESAN_SQL = "Status & urutan belum aktif. Jalankan bagian \"gelombang: status & urutan\" di supabase/kelola.sql pada SQL Editor Supabase.";

export function GelombangManager({ ta: aktifTa }: { ta: string | undefined }) {
  const [ta, setTa] = useState<string | undefined>(aktifTa);
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [list, setList] = useState<Gelombang[]>([]);
  const [e, setE] = useState<Partial<Gelombang>>({});
  const [msg, setMsg] = useState("");
  useEffect(() => { if (!ta && aktifTa) setTa(aktifTa); }, [aktifTa]);
  useEffect(() => {
    supabase.from("tahun_ajaran").select("nama").order("nama", { ascending: false }).then(({ data }) => setTahunList((data ?? []).map((x: { nama: string }) => x.nama)));
  }, []);
  const load = async () => {
    if (!ta) return;
    const { data, error } = await supabase.from("gelombang").select("*").eq("tahun_ajaran", ta).order("mulai");
    if (error) setMsg(tableMissing(error.message)); else setList(urutkanGelombang(data as Gelombang[]));
  };
  useEffect(() => { setE({}); setMsg(""); load(); }, [ta]);
  async function simpan() {
    if (!ta) return setMsg("Pilih tahun ajaran dulu.");
    if (!e.nama || !e.mulai || !e.selesai) return setMsg("Isi nama, tanggal buka, dan tanggal tutup.");
    if (e.selesai < e.mulai) return setMsg("Tanggal tutup harus sesudah tanggal buka.");
    const bentrok = gelombangBentrok(list, { ...(e.id ? { id: e.id } : {}), mulai: e.mulai, selesai: e.selesai });
    if (bentrok.length) return setMsg(`Tanggal bertumpang tindih dengan ${bentrok.map((b) => `${b.nama} (${fmtTgl(b.mulai)} – ${fmtTgl(b.selesai)})`).join(", ")}. Ubah tanggalnya dulu.`);
    const dasar = { nama: e.nama, mulai: e.mulai, selesai: e.selesai, tahun_ajaran: ta };
    const row = { ...dasar, status: e.status ?? "otomatis", urutan: e.id ? e.urutan ?? null : Math.max(0, ...list.map((g) => g.urutan ?? 0)) + 1 };
    const kirim = (r: object) => e.id ? supabase.from("gelombang").update(r).eq("id", e.id) : supabase.from("gelombang").insert(r);
    let { error } = await kirim(row);
    let catatan = "";
    if (error && kolomBaruBelumAda(error.message)) { ({ error } = await kirim(dasar)); catatan = ` ${PESAN_SQL}`; }
    setMsg(error ? tableMissing(error.message) : `Gelombang tersimpan.${catatan}`); if (!error) setE({}); load();
  }
  async function aturStatus(g: Gelombang, status: AturGelombang) {
    const { error } = await supabase.from("gelombang").update({ status }).eq("id", g.id);
    setMsg(error ? (kolomBaruBelumAda(error.message) ? PESAN_SQL : error.message) : `Status ${g.nama} diperbarui.`); load();
  }
  async function geser(i: number, arah: -1 | 1) {
    const j = i + arah;
    if (j < 0 || j >= list.length) return;
    const baru = [...list];
    [baru[i], baru[j]] = [baru[j]!, baru[i]!];
    setList(baru);
    const hasil = await Promise.all(baru.map((g, k) => supabase.from("gelombang").update({ urutan: k + 1 }).eq("id", g.id)));
    const err = hasil.find((h) => h.error)?.error;
    setMsg(err ? (kolomBaruBelumAda(err.message) ? PESAN_SQL : err.message) : "Urutan tampil di beranda diperbarui.");
    load();
  }
  async function hapus(g: Gelombang) { if (confirm(`Hapus ${g.nama}?`)) { await supabase.from("gelombang").delete().eq("id", g.id); load(); } }
  const pilihan = Array.from(new Set([aktifTa, ...tahunList].filter(Boolean))) as string[];
  return (
    <Box title="Kelola Gelombang" msg={msg}>
      <label className="text-sm font-medium">Tahun ajaran
        <select value={ta ?? ""} onChange={(x) => setTa(x.target.value)} className={`${inputCls} mt-1 max-w-[240px]`}>
          {!pilihan.length && <option value="">Belum ada tahun ajaran</option>}
          {pilihan.map((t) => <option key={t} value={t}>{t}{t === aktifTa ? " (aktif)" : ""}</option>)}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        {ta && ta !== aktifTa ? `Anda sedang menyiapkan gelombang untuk ${ta}. Formulir baru memakai jadwal ini setelah ${ta} dijadikan tahun ajaran aktif.` : "Formulir hanya terbuka di antara tanggal buka dan tutup suatu gelombang. Jika belum ada gelombang, formulir mengikuti tombol buka/tutup."}
      </p>
      <div className="grid gap-2 md:grid-cols-5">
        <label className="text-xs text-muted-foreground">Nama gelombang<input value={e.nama ?? ""} onChange={(x) => setE({ ...e, nama: x.target.value })} placeholder={(list.find((x) => x.id === e.id) ?? list[list.length - 1])?.nama ?? "Gelombang I"} className={inputCls} /></label>
        <label className="text-xs text-muted-foreground">Tanggal buka<input type="date" value={e.mulai ?? ""} onChange={(x) => setE({ ...e, mulai: x.target.value })} className={inputCls} /></label>
        <label className="text-xs text-muted-foreground">Tanggal tutup<input type="date" value={e.selesai ?? ""} onChange={(x) => setE({ ...e, selesai: x.target.value })} className={inputCls} /></label>
        <label className="text-xs text-muted-foreground">Status<select value={e.status ?? "otomatis"} onChange={(x) => setE({ ...e, status: x.target.value as AturGelombang })} className={inputCls}>{ATUR.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <div className="flex items-end gap-2"><button onClick={simpan} className={btn}>{e.id ? "Simpan" : "Tambah"}</button>{e.id && <button onClick={() => setE({})} className="rounded-full border border-border px-4 py-2 text-sm">Batal</button>}</div>
      </div>
      {e.mulai && e.selesai && e.selesai >= e.mulai && gelombangBentrok(list, { ...(e.id ? { id: e.id } : {}), mulai: e.mulai, selesai: e.selesai }).map((b) => (
        <p key={b.id} role="alert" className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">Peringatan: tanggal ini bertumpang tindih dengan {b.nama} ({fmtTgl(b.mulai)} – {fmtTgl(b.selesai)}).</p>
      ))}
      <p className="text-xs text-muted-foreground">Urutan di bawah = urutan kartu jadwal di beranda. Gelombang yang disembunyikan tidak tampil; yang ditutup sementara tetap tampil tapi formulir tidak terbuka.</p>
      <ol className="divide-y divide-border border-t border-border">
        {list.map((g, i) => {
          const st = statusGelombang(g);
          return (
            <li key={g.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 py-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => geser(i, -1)} disabled={i === 0} aria-label={`Naikkan ${g.nama}`} className="h-8 w-8 rounded-full border border-border disabled:opacity-30">↑</button>
                <button type="button" onClick={() => geser(i, 1)} disabled={i === list.length - 1} aria-label={`Turunkan ${g.nama}`} className="h-8 w-8 rounded-full border border-border disabled:opacity-30">↓</button>
              </div>
              <div className="min-w-0">
                <p><span className="mr-1 text-muted-foreground">{i + 1}.</span><b>{g.nama}</b> <span className={`ml-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_CLS[st]}`}>{STATUS_LABEL[st]}</span></p>
                <p className="text-muted-foreground">{fmtTgl(g.mulai)} – {fmtTgl(g.selesai)}</p>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
                <select value={g.status ?? "otomatis"} onChange={(x) => aturStatus(g, x.target.value as AturGelombang)} aria-label={`Status ${g.nama}`} className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm">{ATUR.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <button onClick={() => setE(g)} className="text-foreground">Ubah</button><button onClick={() => hapus(g)} className="text-destructive">Hapus</button>
              </div>
            </li>
          );
        })}
        {!list.length && <li className="py-2 text-sm text-muted-foreground">Belum ada gelombang untuk {ta ?? "tahun ajaran ini"}.</li>}
      </ol>
    </Box>
  );
}

export function ProfilManager({ cfg, onSimpan, onDirty }: { cfg: Pengaturan | null; onSimpan: (v: Partial<Pengaturan>) => Promise<string | null>; onDirty?: (dirty: boolean) => void }) {
  const [f, setF] = useState({ alamat: "", telepon: "", email: "", maps_url: "", pengumuman: "" });
  const [st, setSt] = useState<Record<"p" | "k", { ok: boolean; text: string[] } | null>>({ p: null, k: null });
  const [busy, setBusy] = useState<"p" | "k" | null>(null);
  const [mode, setMode] = useState<"desktop" | "hp">("desktop");
  useEffect(() => { setF({
    alamat: cfg?.alamat ?? SEKOLAH_DEFAULT.alamat, telepon: cfg?.telepon ?? SEKOLAH_DEFAULT.telepon,
    email: cfg?.email ?? SEKOLAH_DEFAULT.email, maps_url: cfg?.maps_url ?? SEKOLAH_DEFAULT.maps_url, pengumuman: cfg?.pengumuman ?? "",
  }); }, [cfg]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const tersimpan = {
    alamat: cfg?.alamat ?? SEKOLAH_DEFAULT.alamat, telepon: cfg?.telepon ?? SEKOLAH_DEFAULT.telepon,
    email: cfg?.email ?? SEKOLAH_DEFAULT.email, maps_url: cfg?.maps_url ?? SEKOLAH_DEFAULT.maps_url, pengumuman: cfg?.pengumuman ?? "",
  };
  const kotor = (Object.keys(f) as (keyof typeof f)[]).some((k) => f[k] !== tersimpan[k]);
  useEffect(() => { onDirty?.(kotor); return () => onDirty?.(false); }, [kotor, onDirty]);
  async function simpan(which: "p" | "k") {
    const errs = which === "p"
      ? (teksPolos(f.pengumuman).length > MAKS_PENGUMUMAN ? [`Pengumuman maksimal ${MAKS_PENGUMUMAN} karakter.`] : [])
      : validasiProfil(f);
    if (errs.length) return setSt({ ...st, [which]: { ok: false, text: errs } });
    setBusy(which); setSt({ ...st, [which]: null });
    const err = await onSimpan(which === "p"
      ? { pengumuman: f.pengumuman.trim() || null }
      : { alamat: f.alamat.trim(), telepon: f.telepon.trim(), email: f.email.trim() || null, maps_url: f.maps_url.trim() || null });
    setBusy(null);
    const gagal = err ? [/column|schema cache/i.test(err) ? "Gagal tersimpan: kolom belum ada. Jalankan bagian terbaru supabase/kelola.sql di SQL Editor." : /row-level|permission|policy/i.test(err) ? "Gagal tersimpan: akun Anda tidak punya izin mengubah pengaturan." : "Gagal tersimpan: " + err] : null;
    setSt({ ...st, [which]: gagal ? { ok: false, text: gagal } : { ok: true, text: [which === "p" ? (f.pengumuman.trim() ? "Pengumuman tersimpan dan tampil di situs." : "Pengumuman dikosongkan dan disembunyikan dari situs.") : "Alamat, kontak, dan Maps tersimpan."] } });
  }
  const Status = ({ s }: { s: { ok: boolean; text: string[] } | null }) => s && (
    <div role={s.ok ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${s.ok ? "border-foreground/30 bg-muted text-foreground" : "border-destructive bg-destructive/10 text-destructive"}`}>
      {s.text.map((t) => <p key={t}>{t}</p>)}
    </div>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="grid gap-4">
      <Box title="Pengumuman" msg="">
        <EditorWysiwyg label="Isi pengumuman" value={f.pengumuman} onChange={(h) => setF((x) => ({ ...x, pengumuman: h }))} placeholder="Tulis pengumuman (kosongkan untuk menyembunyikan)" />
        <p className={`text-xs ${teksPolos(f.pengumuman).length > MAKS_PENGUMUMAN ? "text-destructive" : "text-muted-foreground"}`}>{teksPolos(f.pengumuman).length}/{MAKS_PENGUMUMAN} karakter</p>
        <AiPengumuman tahunAjaran={cfg?.tahun_ajaran} onPakai={(teks) => { setF((x) => ({ ...x, pengumuman: teks })); setSt((x) => ({ ...x, p: null })); }} />
        <Status s={st.p} />
        <button disabled={busy === "p"} onClick={() => simpan("p")} className={`${btn} w-fit disabled:opacity-60`}>{busy === "p" ? "Menyimpan…" : "Simpan pengumuman"}</button>
      </Box>
      <Box title="Alamat, Kontak & Maps Sekolah" msg="">
        <textarea value={f.alamat} onChange={set("alamat")} rows={2} placeholder={cfg?.alamat || SEKOLAH_DEFAULT.alamat} className={inputCls} />
        <div className="grid gap-2 md:grid-cols-2">
          <input value={f.telepon} onChange={set("telepon")} placeholder={cfg?.telepon || SEKOLAH_DEFAULT.telepon} className={inputCls} />
          <input value={f.email} onChange={set("email")} type="email" placeholder={cfg?.email || SEKOLAH_DEFAULT.email || "Email (opsional)"} className={inputCls} />
        </div>
        <input value={f.maps_url} onChange={set("maps_url")} placeholder={cfg?.maps_url || SEKOLAH_DEFAULT.maps_url || "Link Google Maps atau koordinat (-7.28, 109.02)"} className={inputCls} />
        <iframe title="Pratinjau peta" src={mapsEmbed(f.maps_url, f.alamat)} className="h-56 w-full rounded-lg border border-border" loading="lazy" />
        <Status s={st.k} />
        <button disabled={busy === "k"} onClick={() => simpan("k")} className={`${btn} w-fit disabled:opacity-60`}>{busy === "k" ? "Menyimpan…" : "Simpan profil"}</button>
      </Box>
      </div>
      <div className="lg:sticky lg:top-4">
      <Box title="Pratinjau Langsung" msg="">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Berubah saat Anda mengetik — belum tersimpan sampai tombol Simpan ditekan.</p>
          {kotor && <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">Belum disimpan</span>}
          <div className="flex gap-1 rounded-full border border-border p-0.5 text-xs">
            {(["desktop", "hp"] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full px-3 py-1 ${mode === m ? "bg-foreground text-background" : ""}`}>{m === "desktop" ? "Layar lebar" : "HP"}</button>)}
          </div>
        </div>
        <div className={`mx-auto w-full overflow-hidden rounded-xl border border-border bg-background ${mode === "hp" ? "max-w-[360px]" : ""}`}>
          {f.pengumuman.trim() ? (
            <div className="border-b border-border bg-secondary px-4 py-1.5 text-center text-xs leading-snug text-secondary-foreground sm:px-5 sm:py-3 sm:text-sm">
              <span className="mr-1.5 font-semibold">📢 Pengumuman:</span><KontenKaya html={f.pengumuman} />
            </div>
          ) : <p className="border-b border-border px-4 py-2 text-center text-xs italic text-muted-foreground">Pengumuman kosong — tidak ditampilkan di situs.</p>}
          <div className={`grid gap-4 p-4 ${mode === "desktop" ? "md:grid-cols-2" : ""}`}>
            <div>
              <h3 className="font-display text-xl font-semibold">Alamat & Kontak</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                <div><dt className="text-muted-foreground">Alamat</dt><dd className="font-medium">{f.alamat || SEKOLAH_DEFAULT.alamat}</dd></div>
                <div><dt className="text-muted-foreground">Telepon</dt><dd className="font-medium">{f.telepon || SEKOLAH_DEFAULT.telepon}</dd></div>
                <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{f.email || SEKOLAH_DEFAULT.email}</dd></div>
              </dl>
            </div>
            <iframe title="Pratinjau lokasi publik" src={mapsEmbed(f.maps_url, f.alamat || SEKOLAH_DEFAULT.alamat)} className="h-48 w-full rounded-lg border border-border" loading="lazy" />
          </div>
        </div>
      </Box>
      </div>
    </div>
  );
}

export function SyaratManager({ cfg, onSimpan }: { cfg: Pengaturan | null; onSimpan: (v: Partial<Pengaturan>) => Promise<string | null> }) {
  const [teks, setTeks] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTeks(cfg?.syarat ?? ""); }, [cfg]);
  const daftar = daftarSyarat(teks);
  async function simpan() {
    setBusy(true); setMsg("");
    const err = await onSimpan({ syarat: teks.trim() || null });
    setBusy(false);
    setMsg(err ? (/column|schema cache/i.test(err) ? "Kolom syarat belum ada. Jalankan bagian terbaru supabase/kelola.sql di SQL Editor Supabase." : "Gagal menyimpan: " + err) : teks.trim() ? "Syarat tersimpan dan tampil di beranda." : "Syarat dikosongkan — beranda memakai syarat bawaan.");
  }
  return (
    <Box title="Syarat Pendaftaran" msg={msg}>
      <p className="text-sm text-muted-foreground">Tulis satu syarat per baris. Kosongkan untuk memakai syarat bawaan.</p>
      <textarea aria-label="Syarat pendaftaran" value={teks} onChange={(e) => setTeks(e.target.value)} rows={7} placeholder={(cfg?.syarat || SYARAT_DEFAULT.join("\n"))} className={inputCls} />
      <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs font-semibold text-muted-foreground">Pratinjau di beranda</p>
        <ol className="mt-2 grid gap-1.5 text-sm">{daftar.map((x, i) => <li key={x + i} className="flex gap-2"><span className="font-semibold text-foreground">{i + 1}.</span>{x}</li>)}</ol>
      </div>
      <button disabled={busy} onClick={simpan} className={`${btn} w-fit disabled:opacity-60`}>{busy ? "Menyimpan…" : "Simpan syarat"}</button>
    </Box>
  );
}

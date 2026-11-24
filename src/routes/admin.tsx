import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Logo, LOGO_RESMI } from "@/components/Logo";
import { kabarkanPengaturan, DEFAULT_TA, SEKOLAH_DEFAULT, type Pengaturan } from "@/lib/tahun";
import { FaqManager, TahunManager, PengelolaManager, GelombangManager, ProfilManager, SyaratManager } from "@/components/AdminManage";
import { AsetManager } from "@/components/AsetManager";
import { VerifPanel, BADGE } from "@/components/VerifPanel";
import { cekOtomatis, type Row } from "@/lib/verifikasi";
import { CEK_VERIFIKASI } from "@/lib/lacak";
import { RekapJurusanPanel } from "@/components/RekapJurusan";
import { checklistLengkap } from "@/lib/rekap";
import { cetakLembar } from "@/lib/lembar";
import { ExportDialog } from "@/components/ExportDialog";
import { DaftarUlangManager } from "@/components/DaftarUlangManager";
import { RegForm } from "@/components/RegForm";
import { Users, GraduationCap, CalendarDays, Waves, ClipboardList, Megaphone, HelpCircle, Image, ShieldCheck, Menu, X, LogOut, ExternalLink, type LucideIcon } from "lucide-react";

const MENU_ADMIN: { judul: string; item: [string, string, LucideIcon][] }[] = [
  { judul: "Data Siswa", item: [["pendaftar", "Pendaftar", Users], ["daftarulang", "Daftar Ulang", GraduationCap]] },
  { judul: "Pengaturan PPDB", item: [["tahun", "Tahun Ajaran", CalendarDays], ["gelombang", "Gelombang", Waves], ["syarat", "Syarat", ClipboardList]] },
  { judul: "Konten", item: [["profil", "Profil & Pengumuman", Megaphone], ["faq", "FAQ", HelpCircle], ["aset", "Logo & Galeri", Image]] },
  { judul: "Sistem", item: [["pengelola", "User Pengelola", ShieldCheck]] },
];

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin PPDB — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Panel panitia untuk mengelola pendaftar dan tahun ajaran PPDB." },
      { property: "og:title", content: "Admin PPDB SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola pendaftaran dan tahun ajaran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

// Username "admin" maps to this Supabase Auth account.
export const ADMIN_EMAIL = "admin1@gmail.com";
const toEmail = (u: string) => (u.includes("@") ? u : u.trim().toLowerCase() === "admin" ? ADMIN_EMAIL : `${u}@smkmuh1paguyangan.sch.id`);
const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:border-foreground/40";

type Pendaftar = Record<string, string | null> & { id: string; nama: string; status: string | null; nisn: string; jurusan: string; asal_sekolah: string; no_hp: string; tahun_ajaran: string | null };

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return null;
  return session ? <Dashboard /> : <Login />;
}

function Login() {
  const [u, setU] = useState("admin1@gmail.com");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(u), password: p });
    if (error) setErr(/not confirmed/i.test(error.message) ? "Email admin belum dikonfirmasi. Konfirmasi akun di Supabase → Authentication → Users." : /invalid/i.test(error.message) ? "Email atau password salah." : "Gagal masuk: " + error.message);
    setBusy(false);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-5">
      <form onSubmit={go} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Logo className="mx-auto h-14 w-14" />
        <h1 className="mt-4 text-center font-display text-2xl font-semibold">Admin PPDB</h1>
        <div className="mt-6 grid gap-3">
          <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" className={inputCls} />
          <input value={p} onChange={(e) => setP(e.target.value)} type="password" placeholder="Password" className={inputCls} />
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <button disabled={busy} className="rounded-full bg-foreground py-2.5 font-medium text-background disabled:opacity-60">{busy ? "Masuk..." : "Masuk"}</button>
        </div>
      </form>
    </div>
  );
}

const STATUS = ["baru", "diverifikasi", "diterima", "ditolak"];
const DOCS = ["foto", "kk", "akta", "skl"];
const CEK: string[] = [...CEK_VERIFIKASI];
type Verif = Record<string, boolean>;

import { KATEGORI_CARI, URUTAN, cocokCari, urutkan, type KategoriCari, type Urutan } from "@/lib/cari";

function Dashboard() {
  const [cfg, setCfg] = useState<Pengaturan | null>(null);
  const [taBaru, setTaBaru] = useState("");
  const [list, setList] = useState<Pendaftar[]>([]);
  const [filterTa, setFilterTa] = useState("");
  const [filterGel, setFilterGel] = useState("");
  const [q, setQ] = useState("");
  const [kat, setKat] = useState<KategoriCari>("semua");
  const [urut, setUrut] = useState<Urutan>("baru");
  const [fStatus, setFStatus] = useState("");
  const [fJur, setFJur] = useState("");
  const [fLevel, setFLevel] = useState("");
  const [fBelum, setFBelum] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("pendaftar");
  const [menuBuka, setMenuBuka] = useState(false);
  const [profilKotor, setProfilKotor] = useState(false);
  const PESAN_KOTOR = "Ada perubahan Profil & Pengumuman yang belum disimpan. Tinggalkan tanpa menyimpan?";
  const gantiTab = (k: string) => {
    if (tab === "profil" && k !== "profil" && profilKotor && !confirm(PESAN_KOTOR)) return;
    setTab(k);
  };
  // Muat ulang / tutup tab / "Lihat situs" memakai dialog bawaan browser; navigasi di dalam situs memakai konfirmasi.
  useBlocker({ shouldBlockFn: () => profilKotor && !confirm(PESAN_KOTOR), enableBeforeUnload: () => profilKotor });
  const [petugas, setPetugas] = useState("");
  const [cek, setCek] = useState<Pendaftar | null>(null);
  const [ekspor, setEkspor] = useState(false);
  const [tambah, setTambah] = useState(false);
  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email ?? "";
    const { data: p } = await supabase.from("pengelola").select("nama").eq("email", email).maybeSingle();
    setPetugas((p?.nama as string) || email);
  })(); }, []);
  async function simpanVerif(r: Pendaftar, v: Verif, catatan: string, status: string) {
    const lengkap = CEK.every((c) => v[c]);
    const st = lengkap && status === "baru" ? "diverifikasi" : status;
    const row = { verifikasi: v, catatan: catatan || null, status: st, petugas, diverifikasi_at: new Date().toISOString() };
    const { error } = await supabase.from("pendaftar").update(row as never).eq("id", r.id);
    if (error) { setMsg(/column|schema cache/i.test(error.message) ? "Kolom catatan/verifikasi belum ada. Jalankan bagian terbaru supabase/kelola.sql." : "Gagal simpan verifikasi: " + error.message); return; }
    setMsg(`Verifikasi ${r.nama} tersimpan (status: ${st}) oleh ${petugas}.`); setCek(null); load();
  }

  async function load() {
    const { data: c } = await supabase.from("pengaturan_ppdb").select("*").eq("id", 1).maybeSingle();
    if (c) { setCfg(c as Pengaturan); setTaBaru((c as Pengaturan).tahun_ajaran); setFilterTa((f) => f || (c as Pengaturan).tahun_ajaran); }
    const { data, error } = await supabase.from("pendaftar").select("*").order("created_at", { ascending: false });
    if (error) setMsg("Gagal memuat pendaftar: " + error.message);
    else setList((data ?? []) as Pendaftar[]);
  }
  useEffect(() => { load(); }, []);

  async function simpanCfg(next: Partial<Pengaturan>) {
    const { error } = await supabase.from("pengaturan_ppdb").upsert({ id: 1, tahun_ajaran: cfg?.tahun_ajaran ?? taBaru, dibuka: cfg?.dibuka ?? true, ...next });
    setMsg(error ? (/column|schema cache/i.test(error.message) ? "Kolom belum ada. Jalankan bagian terbaru supabase/kelola.sql." : "Gagal menyimpan: " + error.message) : "Pengaturan tersimpan.");
    if (!error) kabarkanPengaturan();
    load();
    return error ? error.message : null;
  }
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("pendaftar").update({ status }).eq("id", id);
    if (error) setMsg("Gagal ubah status: " + error.message);
    else setList((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  async function setStatusMassal(status: string) {
    const ids = shown.map((x) => x.id);
    if (!ids.length || !status) return;
    if (!confirm(`Ubah status ${ids.length} pendaftar yang tampil menjadi "${status}"?`)) return;
    const { error } = await supabase.from("pendaftar").update({ status }).in("id", ids);
    if (error) return setMsg("Gagal ubah status massal: " + error.message);
    setList((l) => l.map((x) => (ids.includes(x.id) ? { ...x, status } : x)));
    setMsg(`Status ${ids.length} pendaftar diubah menjadi "${status}".`);
  }
  async function hapus(id: string) {
    if (!confirm("Hapus pendaftar ini?")) return;
    const { error } = await supabase.from("pendaftar").delete().eq("id", id);
    if (error) setMsg("Gagal hapus: " + error.message); else setList((l) => l.filter((x) => x.id !== id));
  }
  async function buka(path: string) {
    const { data, error } = await supabase.storage.from("berkas").createSignedUrl(path, 300);
    if (error || !data) return setMsg("Berkas tidak bisa dibuka.");
    window.open(data.signedUrl, "_blank");
  }
  const tahunList = Array.from(new Set([cfg?.tahun_ajaran, ...list.map((x) => x.tahun_ajaran)].filter(Boolean))) as string[];
  const gelList = Array.from(new Set(list.filter((x) => !filterTa || x.tahun_ajaran === filterTa).map((x) => x["gelombang"] as string | null).filter(Boolean))) as string[];
  const auto = (x: Pendaftar) => cekOtomatis(x as unknown as Row, list as unknown as Row[], cfg?.wajib_berkas !== false);
  const belumDicek = (x: Pendaftar) => (x.status ?? "baru") === "baru" && !CEK.some((c) => ((x as unknown as { verifikasi?: Verif }).verifikasi ?? {})[c]);
  const cetak = (x: Pendaftar) => { if (!cetakLembar(x as never, { ta: cfg?.tahun_ajaran, logo: cfg?.logo_url || `${window.location.origin}${LOGO_RESMI}`, petugas })) setMsg("Izinkan pop-up untuk mencetak lembar kendali."); };
  const jurList = Array.from(new Set(list.map((x) => x.jurusan).filter(Boolean)));
  const saring = list.filter((x) => (!fStatus || (x.status ?? "baru") === fStatus) && (!fJur || x.jurusan === fJur) && (!fLevel || auto(x).level === fLevel) && (!fBelum || belumDicek(x)) && (!filterTa || x.tahun_ajaran === filterTa) && (!filterGel || (filterGel === "-" ? !x["gelombang"] : x["gelombang"] === filterGel)) && cocokCari(x as never, q, kat));
  const shown = urutkan(saring as never[], urut, CEK) as unknown as Pendaftar[];
  const adaFilter = !!(q || kat !== "semua" || urut !== "baru" || fStatus || fJur || fLevel || fBelum || filterGel || (cfg && filterTa !== cfg.tahun_ajaran));
  const resetSemua = () => { setQ(""); setKat("semua"); setUrut("baru"); setFStatus(""); setFJur(""); setFLevel(""); setFBelum(false); setFilterGel(""); setFilterTa(cfg?.tahun_ajaran ?? ""); };

  return (
    <div className="flex min-h-screen bg-muted font-sans text-foreground">
      {menuBuka && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setMenuBuka(false)} />}
      <aside aria-label="Menu admin" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuBuka ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Logo src={cfg?.logo_url} className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1"><p className="truncate font-display text-lg font-bold">Admin PPDB</p><p className="truncate text-xs text-muted-foreground">TA {cfg?.tahun_ajaran ?? "-"} · {cfg?.dibuka === false ? "Ditutup" : "Dibuka"}</p></div>
          <button aria-label="Tutup menu" onClick={() => setMenuBuka(false)} className="rounded-md p-1 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {MENU_ADMIN.map((g) => (
            <div key={g.judul} className="mb-4">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.judul}</p>
              {g.item.map(([k, l, Ikon]) => (
                <button key={k} onClick={() => { gantiTab(k); setMenuBuka(false); }} aria-current={tab === k ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <Ikon className="h-4 w-4 shrink-0" /><span className="flex-1 truncate">{l}</span>
                  {k === "pendaftar" && <span className="rounded-full bg-muted px-2 text-xs text-foreground">{list.length}</span>}
                  {k === "profil" && profilKotor && <span className="h-2 w-2 rounded-full bg-accent" title="Belum disimpan" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="truncate px-1 pb-2 text-xs text-muted-foreground">Masuk sebagai <b className="text-foreground">{petugas || "-"}</b></p>
          <div className="flex gap-2">
            <a href="/" className="flex flex-1 items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm"><ExternalLink className="h-4 w-4" />Situs</a>
            <button onClick={() => { if (profilKotor && !confirm(PESAN_KOTOR)) return; supabase.auth.signOut(); }} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-sm text-background"><LogOut className="h-4 w-4" />Keluar</button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background px-3 py-2 lg:hidden">
        <button aria-label="Buka menu" onClick={() => setMenuBuka(true)} className="rounded-md p-2"><Menu className="h-5 w-5" /></button>
        <p className="truncate font-display font-bold">{MENU_ADMIN.flatMap((g) => g.item).find((i) => i[0] === tab)?.[1] ?? "Admin PPDB"}</p>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 px-3 py-4 sm:gap-6 sm:px-5 sm:py-8">
        {ekspor && <ExportDialog rows={shown} ta={filterTa} gel={filterGel} petugas={petugas} onClose={() => setEkspor(false)} />}
        {tambah && <div role="dialog" aria-modal="true" aria-label="Tambah pendaftar" className="fixed inset-0 z-50 overflow-y-auto bg-foreground/50 p-3 sm:p-6">
          <div className="mx-auto max-w-3xl rounded-2xl bg-background p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-display text-xl font-semibold">Tambah Pendaftar</h2><p className="text-sm text-muted-foreground">Untuk calon siswa yang datang langsung ke sekolah. Unggah berkas tidak wajib — cek berkas asli lewat tombol Verifikasi.</p></div>
              <button aria-label="Tutup" onClick={() => { setTambah(false); load(); }} className="rounded-md p-1"><X className="h-5 w-5" /></button>
            </div>
            <RegForm tahunAjaran={cfg?.tahun_ajaran ?? DEFAULT_TA} wajibBerkas={false} telepon={cfg?.telepon || SEKOLAH_DEFAULT.telepon} />
          </div>
        </div>}
        {msg && <p role="status" className="rounded-lg border border-border bg-card px-4 py-2 text-sm">{msg}</p>}
        {tab === "faq" && <FaqManager />}
        {tab === "daftarulang" && <DaftarUlangManager list={list as never} onUpdate={(id, patch) => setList((l) => l.map((x) => (x.id === id ? ({ ...x, ...patch } as never) : x)))} />}
        {tab === "syarat" && <SyaratManager cfg={cfg} onSimpan={simpanCfg} />}
        {tab === "profil" && <ProfilManager cfg={cfg} onSimpan={simpanCfg} onDirty={setProfilKotor} />}
        {tab === "aset" && <AsetManager cfg={cfg} onSimpan={simpanCfg} />}
        {tab === "gelombang" && <GelombangManager ta={cfg?.tahun_ajaran} />}
        {tab === "pengelola" && <PengelolaManager />}
        {tab === "tahun" && <TahunManager aktif={cfg?.tahun_ajaran} onAktifkan={(t) => simpanCfg({ tahun_ajaran: t })} />}
        {(tab === "tahun" || tab === "pendaftar") && <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Tahun Ajaran</h2>
          <p className="mt-1 text-sm text-muted-foreground">Aktif: <b className="text-foreground">{cfg?.tahun_ajaran ?? "belum diatur"}</b> · Pendaftaran {cfg?.dibuka === false ? "ditutup" : "dibuka"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={taBaru} onChange={(e) => setTaBaru(e.target.value)} placeholder={cfg?.tahun_ajaran ?? "2027/2028"} className={`${inputCls} max-w-[180px]`} />
            <button onClick={() => /^\d{4}\/\d{4}$/.test(taBaru) ? simpanCfg({ tahun_ajaran: taBaru }) : setMsg("Format tahun ajaran: 2027/2028")} className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background">Jadikan aktif</button>
            <button onClick={() => simpanCfg({ dibuka: !(cfg?.dibuka ?? true) })} className="rounded-full border border-foreground/30 px-5 py-2.5 text-sm text-foreground">{cfg?.dibuka === false ? "Buka pendaftaran" : "Tutup pendaftaran"}</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span>Mode pendaftaran:</span>
            {([[true, "Dengan upload dokumen"], [false, "Tanpa upload dokumen"]] as [boolean, string][]).map(([v, l]) => (
              <button key={l} onClick={() => simpanCfg({ wajib_berkas: v })} className={`rounded-full px-4 py-1.5 ${(cfg?.wajib_berkas !== false) === v ? "bg-foreground text-background" : "border border-border"}`}>{l}</button>
            ))}
          </div>
          {cfg?.wajib_berkas === false && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/50 p-3 text-sm">
            <span className="flex-1 text-muted-foreground">Mode manual aktif: calon siswa tidak wajib unggah berkas. Yang datang langsung bisa didaftarkan panitia di sini.</span>
            <button onClick={() => { gantiTab("pendaftar"); setTambah(true); }} className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">+ Tambah Pendaftar Manual</button>
          </div>}
        </section>}

        {tab === "pendaftar" && (() => {
          const dasar = list.filter((x) => (!filterTa || x.tahun_ajaran === filterTa) && (!filterGel || (filterGel === "-" ? !x["gelombang"] : x["gelombang"] === filterGel)));
          return <RekapJurusanPanel rows={dasar as never} cek={CEK} aktif={fJur}
            onLihat={(j) => setFJur(fJur === j ? "" : j)}
            onIsiChecklist={(j) => {
              setFJur(j); setFStatus(""); setFLevel(""); setFBelum(false); setQ("");
              const pertama = dasar.find((x) => x.jurusan === j && !checklistLengkap(x as never, CEK));
              if (pertama) setCek(pertama);
            }} />;
        })()}
        {tab === "pendaftar" && <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Pendaftar ({shown.length})</h2>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <select value={filterTa} onChange={(e) => setFilterTa(e.target.value)} className={`${inputCls} sm:w-auto`}>
                <option value="">Semua tahun</option>
                {tahunList.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={filterGel} onChange={(e) => setFilterGel(e.target.value)} className={`${inputCls} sm:w-auto`}>
                <option value="">Semua gelombang</option>
                {gelList.map((g) => <option key={g}>{g}</option>)}
                <option value="-">Tanpa gelombang</option>
              </select>
              
              <select value="" onChange={(e) => setStatusMassal(e.target.value)} disabled={!shown.length} className={`${inputCls} col-span-2 sm:w-auto`} aria-label="Ubah status semua yang tampil">
                <option value="">Ubah status semua ({shown.length})…</option>
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => setTambah(true)} className="col-span-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-1">+ Tambah Pendaftar</button>
              <button onClick={() => setEkspor(true)} className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Unduh Excel / PDF</button>
              <button onClick={() => { if (!cetakLembar(null, { ta: cfg?.tahun_ajaran, logo: cfg?.logo_url || `${window.location.origin}${LOGO_RESMI}`, petugas: "" })) setMsg("Izinkan pop-up untuk mencetak."); }} className="col-span-2 rounded-full border border-foreground/30 px-4 py-2 text-sm text-foreground sm:col-span-1">Cetak blanko kosong</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
            <select aria-label="Kategori pencarian" value={kat} onChange={(e) => setKat(e.target.value as KategoriCari)} className={inputCls}>{KATEGORI_CARI.map((k) => <option key={k.k} value={k.k}>{k.l}</option>)}</select>
            <input type="search" aria-label="Cari pendaftar" value={q} onChange={(e) => setQ(e.target.value)} placeholder={KATEGORI_CARI.find((k) => k.k === kat)?.ph} className={`${inputCls} col-span-2 sm:col-span-1`} />
            <select aria-label="Urutkan" value={urut} onChange={(e) => setUrut(e.target.value as Urutan)} className={inputCls}>{URUTAN.map((u) => <option key={u.k} value={u.k}>Urut: {u.l}</option>)}</select>
            <button onClick={resetSemua} disabled={!adaFilter} className="rounded-full border border-border bg-background px-4 py-2 text-sm disabled:opacity-50">Reset filter & cari</button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {[["", "Semua"], ...STATUS.map((s) => [s, s === "baru" ? "Belum diverifikasi" : s[0]!.toUpperCase() + s.slice(1)])].map(([k, l]) => (
              <button key={k} onClick={() => setFStatus(k!)} className={`shrink-0 rounded-full px-3 py-1 text-xs ${fStatus === k ? "bg-foreground text-background" : "border border-border"}`}>{l} ({list.filter((x) => !k || (x.status ?? "baru") === k).length})</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <select value={fJur} onChange={(e) => setFJur(e.target.value)} className="rounded-full border border-border bg-background px-3 py-1 text-xs"><option value="">Semua jurusan</option>{jurList.map((j) => <option key={j}>{j}</option>)}</select>
            <button onClick={() => setFBelum(!fBelum)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${fBelum ? "bg-foreground text-background" : "border-border"}`}>Belum dicek ({list.filter(belumDicek).length})</button>
            {(Object.keys(BADGE) as (keyof typeof BADGE)[]).map((k) => (
              <button key={k} onClick={() => setFLevel(fLevel === k ? "" : k)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${fLevel === k ? "ring-2 ring-foreground/30" : ""} ${BADGE[k][1]}`}>{BADGE[k][0]}</button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:hidden">
            {shown.map((r) => { const a = auto(r); const v = (r as unknown as { verifikasi?: Verif }).verifikasi ?? {}; return (
              <article key={r.id} className="rounded-xl border border-border bg-background p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0"><p className="truncate font-medium">{r.nama}</p>{r["no_daftar"] && <p className="font-mono text-[11px] text-foreground">{r["no_daftar"]}</p>}<p className="text-xs text-muted-foreground">{r.jurusan} · {r.asal_sekolah}</p><p className="text-xs text-muted-foreground">NISN {r.nisn}</p></div>
                  <span title={a.peringatan.join("\n")} className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${BADGE[a.level][1]}`}>{BADGE[a.level][0]}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{DOCS.map((d) => r[`berkas_${d}`] ? <button key={d} onClick={() => buka(r[`berkas_${d}`]!)} className="rounded border border-border px-2 py-1 text-xs uppercase">{d}</button> : null)}<a className="rounded border border-border px-2 py-1 text-xs text-foreground" href={`https://wa.me/${(r.no_hp ?? "").replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer">WA {r.no_hp}</a></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => setCek(r)} className="rounded-full bg-foreground py-2 text-sm text-background">Periksa {CEK.filter((c) => v[c]).length}/{CEK.length}</button>
                  <select value={r.status ?? "baru"} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded-full border border-input bg-background px-3 py-2 text-sm">{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
                  <button onClick={() => cetak(r)} className="rounded-full border border-border py-2 text-sm">Cetak lembar</button>
                  <button onClick={() => hapus(r.id)} className="rounded-full border border-destructive/40 py-2 text-sm text-destructive">Hapus</button>
                </div>
                {r["petugas"] && <p className="mt-2 text-[11px] text-muted-foreground">Dicek oleh {r["petugas"]}</p>}
              </article>
            ); })}
            {!shown.length && <p className="p-6 text-center text-sm text-muted-foreground">{list.length ? "Tidak ada pendaftar yang cocok." : "Belum ada pendaftar."}</p>}
          </div>
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr><th className="p-2">Nama</th><th className="p-2">NISN</th><th className="p-2">Jurusan</th><th className="p-2">Asal</th><th className="p-2">HP</th><th className="p-2">Berkas</th><th className="p-2">Verifikasi</th><th className="p-2">Status</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2 font-medium">{r.nama}{r["no_daftar"] && <div className="font-mono text-[11px] text-foreground">{r["no_daftar"]}</div>}<div className="text-xs text-muted-foreground">{r.tahun_ajaran}{r["gelombang"] ? ` · ${r["gelombang"]}` : ""}</div></td>
                    <td className="p-2">{r.nisn}</td><td className="p-2">{r.jurusan}</td><td className="p-2">{r.asal_sekolah}</td>
                    <td className="p-2"><a className="text-foreground" href={`https://wa.me/${(r.no_hp ?? "").replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer">{r.no_hp}</a></td>
                    <td className="p-2"><div className="flex gap-1">{DOCS.map((d) => r[`berkas_${d}`] ? <button key={d} onClick={() => buka(r[`berkas_${d}`]!)} className="rounded border border-border px-1.5 text-xs uppercase">{d}</button> : null)}</div></td>
                    <td className="p-2">{(() => { const a = auto(r); return <span title={a.peringatan.join("\n")} className={`mb-1 inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${BADGE[a.level][1]}`}>{BADGE[a.level][0]}</span>; })()}<br /><button onClick={() => setCek(r)} className="rounded border border-foreground/30 px-2 py-0.5 text-xs text-foreground">Periksa {(() => { const v = (r as unknown as { verifikasi?: Verif }).verifikasi ?? {}; return `${CEK.filter((c) => v[c]).length}/${CEK.length}`; })()}</button>{r["petugas"] && <div className="text-[11px] text-muted-foreground">oleh {r["petugas"]}</div>}</td>
                    <td className="p-2"><select value={r.status ?? "baru"} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded border border-input bg-background px-2 py-1">{STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
                    <td className="p-2"><button onClick={() => cetak(r)} className="mr-2 text-xs text-foreground">Cetak</button><button onClick={() => hapus(r.id)} className="text-xs text-destructive">Hapus</button></td>
                  </tr>
                ))}
                {!shown.length && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">{list.length ? "Tidak ada pendaftar yang cocok." : "Belum ada pendaftar."}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>}
        {cek && (() => { const a = auto(cek); const i = shown.findIndex((x) => x.id === cek.id); return <VerifPanel key={cek.id} pos={i >= 0 ? `${i + 1} dari ${shown.length}` : undefined} onPrev={i > 0 ? () => setCek(shown[i - 1]!) : undefined} onNext={i >= 0 && i < shown.length - 1 ? () => setCek(shown[i + 1]!) : undefined} onCetak={() => cetak(cek)} r={cek as never} cek={CEK} peringatan={a.peringatan} level={a.level} petugas={petugas} statusList={STATUS} onClose={() => setCek(null)} onSave={(v, c, st) => simpanVerif(cek, v, c, st)} />; })()}
      </main>
      </div>
    </div>
  );
}

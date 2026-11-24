import { createFileRoute, Link } from "@tanstack/react-router";
import { KontenKaya } from "@/components/EditorWysiwyg";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  CloudUpload,
  FileCheck2,
  GraduationCap,
  Instagram,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MousePointerClick,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RegForm } from "@/components/RegForm";
import { FormCepat, type DataCepat } from "@/components/FormCepat";
import { Logo } from "@/components/Logo";
import imgHeader from "@/assets/foto-siswa-hero.jpg";
import imgOto from "@/assets/galeri-otomotif.jpg";
import imgPplg from "@/assets/galeri-pplg.jpg";
import imgBrf from "@/assets/galeri-broadcast.jpg";
import { useTahunAjaran, useGelombang, gelombangAktif, statusGelombang, fmtTgl, SEKOLAH_DEFAULT, mapsEmbed, daftarSyarat, type StatusGelombang } from "@/lib/tahun";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const MENU: [string, string][] = [
  ["#beranda", "Beranda"],
  ["#jurusan", "Program Keahlian"],
  ["#alur", "Alur PPDB"],
  ["#informasi", "Informasi"],
  ["#faq", "FAQ"],
  ["#kontak", "Kontak"],
];

function MenuHP() {
  return (
    <Sheet>
      <SheetTrigger aria-label="Buka menu" className="rounded-xl border border-border p-2.5 lg:hidden"><Menu className="h-5 w-5" /></SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetTitle className="flex items-center gap-3 font-display text-lg"><Logo className="h-10 w-10" />Menu PPDB</SheetTitle>
        <nav className="mt-7 grid gap-1">
          {MENU.map(([h, l]) => <SheetClose asChild key={h}><a href={h} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-secondary hover:text-primary">{l}</a></SheetClose>)}
          <SheetClose asChild><Link to="/lacak" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-secondary hover:text-primary">Cek Status Pendaftaran</Link></SheetClose>
          <SheetClose asChild><Link to="/admin" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-secondary hover:text-primary">Login Admin</Link></SheetClose>
        </nav>
        <SheetClose asChild><a href="#daftar" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Daftar Sekarang<ArrowRight className="h-4 w-4" /></a></SheetClose>
      </SheetContent>
    </Sheet>
  );
}

const FAQ: [string, string][] = [
  ["Apa saja syarat pendaftaran?", "Pas foto, Kartu Keluarga, Akta Kelahiran, dan SKL atau rapor terakhir. Semua berkas diunggah langsung di formulir."],
  ["Apakah pendaftaran dipungut biaya?", "Pendaftaran online tidak dipungut biaya. Informasi biaya sekolah disampaikan saat daftar ulang."],
  ["Format dan ukuran berkas apa yang diterima?", "JPG, PNG, WebP, atau PDF dengan ukuran maksimal 4 MB per berkas. Foto otomatis dikompres dan disimpan sebagai WebP."],
  ["Bagaimana saya tahu pendaftaran berhasil?", "Setelah formulir terkirim akan muncul halaman konfirmasi berisi nomor pendaftaran dan langkah selanjutnya."],
  ["Bagaimana cara mengecek status pendaftaran?", "Buka menu Cek Status, lalu masukkan nomor pendaftaran dan tanggal lahir untuk melihat progres dan hasil seleksi."],
  ["Bagaimana jika saya mengalami kendala?", "Silakan hubungi panitia atau datang ke sekretariat PPDB SMK Muhammadiyah 1 Paguyangan pada jam kerja."],
];

const JURUSAN = [
  { k: "TKR", n: "Teknik Kendaraan Ringan", d: "Perawatan, perbaikan, dan diagnosis sistem mekanik serta kelistrikan kendaraan roda empat atau lebih.", img: imgOto },
  { k: "TSM", n: "Teknik Sepeda Motor", d: "Keterampilan perawatan, servis, perbaikan mesin, dan kelistrikan sepeda motor.", img: imgOto },
  { k: "TOTR", n: "Teknik Ototronik", d: "Penguasaan sistem elektronik, kontrol, dan kelistrikan modern pada kendaraan bermotor.", img: imgOto },
  { k: "RPL", n: "Rekayasa Perangkat Lunak", d: "Perancangan, pembuatan, pengujian, dan pemeliharaan perangkat lunak atau aplikasi.", img: imgPplg },
  { k: "BDF", n: "Broadcasting dan Perfilman", d: "Produksi konten audio-visual, sinematografi, penyutradaraan, penyuntingan, dan penyiaran.", img: imgBrf },
];

const PRESTASI = [
  { t: "2025", j: "Juara 1 LKS Otomotif Tingkat Kabupaten Brebes", l: "Kabupaten" },
  { t: "2025", j: "Juara 2 Lomba Web Design SMK se-Jawa Tengah", l: "Provinsi" },
  { t: "2024", j: "Juara 1 Lomba Video Pendek Pelajar Muhammadiyah", l: "Provinsi" },
  { t: "2024", j: "Juara Umum Kompetisi Tapak Suci Pelajar", l: "Kabupaten" },
  { t: "2025", j: "Juara 3 Lomba Kompetensi Siswa RPL Tingkat Provinsi", l: "Provinsi" },
  { t: "2025", j: "Juara 1 Lomba Pidato Bahasa Inggris Pelajar Brebes", l: "Kabupaten" },
  { t: "2024", j: "Juara 2 Festival Film Pelajar Jawa Tengah", l: "Provinsi" },
  { t: "2024", j: "Juara 1 Lomba Tartil Al-Qur'an Pelajar Muhammadiyah", l: "Kabupaten" },
];

const ALUR: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MousePointerClick, title: "Daftar Online", text: "Isi formulir pendaftaran secara online" },
  { icon: CloudUpload, title: "Unggah Berkas", text: "Unggah dokumen yang diperlukan" },
  { icon: BadgeCheck, title: "Verifikasi", text: "Panitia memeriksa berkas pendaftaran" },
  { icon: Trophy, title: "Seleksi", text: "Ikuti proses seleksi sesuai jadwal" },
  { icon: Megaphone, title: "Pengumuman", text: "Lihat hasil seleksi secara online" },
  { icon: UsersRound, title: "Daftar Ulang", text: "Selesaikan administrasi daftar ulang" },
];

const INSTAGRAM = "smk.mutu.pgy";
const LABEL_JADWAL: Record<StatusGelombang, string> = { dibuka: "Sedang berlangsung", akan: "Segera dibuka", ditutup: "Ditutup sementara", selesai: "Selesai", sembunyi: "" };
const JADWAL = [["Gelombang I", "Januari – Maret"], ["Gelombang II", "April – Mei"], ["Gelombang III", "Juni – Juli"], ["Masa Orientasi", "Juli"]];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PPDB SMK Muhammadiyah 1 Paguyangan 2027/2028" },
      { name: "description", content: "Daftar online PPDB SMK Muhammadiyah 1 Paguyangan. Pilih program keahlian, unggah berkas, dan pantau hasil seleksi dengan mudah." },
      { property: "og:title", content: "PPDB SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Wujudkan masa depan cerah bersama SMK Muhammadiyah 1 Paguyangan — unggul, islami, dan siap kerja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function PitaPengumuman({ teks }: { teks: string }) {
  const [buka, setBuka] = useState(false);
  const panjang = teks.trim().length > 90 || teks.includes("\n");
  return (
    <div role="note" className="border-b border-gold/30 bg-sun px-4 py-2 text-sun-foreground sm:px-5">
      <p className={`mx-auto max-w-5xl text-center text-xs leading-relaxed sm:text-sm ${buka ? "" : "line-clamp-2 sm:line-clamp-none"}`}>
        <Megaphone className="mr-2 inline h-4 w-4" /><span className="mr-1.5 font-bold">Pengumuman:</span><KontenKaya html={teks} />
      </p>
      {panjang && <button type="button" onClick={() => setBuka((v) => !v)} aria-expanded={buka} className="mx-auto mt-1 block text-xs font-bold text-primary hover:underline sm:hidden">{buka ? "Tutup" : "Baca selengkapnya"}</button>}
    </div>
  );
}

function JudulBagian({ eyebrow, children, description }: { eyebrow: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{children}</h2>
      <span className="mx-auto mt-4 block h-1 w-16 rounded-full bg-gold" />
      {description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
    </div>
  );
}

function Index() {
  const ta = useTahunAjaran();
  const gel = useGelombang(ta.tahun_ajaran);
  const gAktif = gelombangAktif(gel);
  const pendaftaranDibuka = ta.dibuka && (!gel.length || !!gAktif);
  const jadwal: { nama: string; tgl: string; st?: StatusGelombang }[] = gel.length
    ? gel.map((g) => ({ nama: g.nama, tgl: `${fmtTgl(g.mulai)} – ${fmtTgl(g.selesai)}`, st: statusGelombang(g) }))
    : JADWAL.map(([nama, tgl]) => ({ nama: nama!, tgl: tgl! }));
  const next = gel.find((g) => statusGelombang(g) === "akan");
  const [faq, setFaq] = useState<[string, string][]>(FAQ);
  const [dataAwal, setDataAwal] = useState<DataCepat | undefined>();
  useEffect(() => { supabase.from("faq").select("pertanyaan,jawaban").order("urutan").then(({ data }) => { if (data?.length) setFaq(data.map((r) => [r.pertanyaan as string, r.jawaban as string])); }); }, []);
  const alamat = ta.alamat || SEKOLAH_DEFAULT.alamat;
  const telepon = ta.telepon || SEKOLAH_DEFAULT.telepon;
  const email = ta.email || SEKOLAH_DEFAULT.email;
  const mapsLink = ta.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}`;

  function lanjutDariFormCepat(data: DataCepat) {
    setDataAwal(data);
    window.setTimeout(() => document.getElementById("daftar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#beranda" className="flex min-w-0 items-center gap-3">
            <Logo src={ta.logo_url} className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-extrabold text-navy sm:text-base">SMK MUHAMMADIYAH 1</p>
              <p className="truncate font-display text-sm font-extrabold text-primary sm:text-base">PAGUYANGAN</p>
              <p className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:block">Unggul · Islami · Siap Kerja</p>
            </div>
          </a>
          <nav className="hidden items-center gap-6 text-[13px] font-semibold lg:flex">
            {MENU.map(([h, l]) => <a key={h} href={h} className="transition hover:text-primary">{l}</a>)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/lacak" className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-navy sm:flex"><UserRoundCheck className="h-4 w-4" />Cek Status</Link>
            <Link to="/admin" aria-label="Login Admin" className="hidden rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-primary hover:border-primary md:block">Admin</Link>
            <MenuHP />
          </div>
        </div>
      </header>
      {ta.pengumuman && <PitaPengumuman teks={ta.pengumuman} />}

      <main>
        <section id="beranda" className="relative isolate scroll-mt-24 overflow-hidden bg-sky">
          <div className="absolute -left-28 -top-32 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 -z-10 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-20">
            <div className="reveal text-center lg:text-left">
              <p className="font-accent text-3xl font-bold text-primary sm:text-4xl">Berakhlak Mulia, Berprestasi</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs font-extrabold text-navy shadow-sm sm:text-sm"><Sparkles className="h-4 w-4" />Penerimaan Peserta Didik Baru {ta.tahun_ajaran}</div>
              <h1 className="mt-4 font-display text-6xl font-extrabold leading-none tracking-[-0.06em] text-primary sm:text-7xl lg:text-8xl">PPDB</h1>
              <p className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl lg:text-4xl">SMK MUHAMMADIYAH 1<br className="hidden sm:block" /> PAGUYANGAN</p>
              <p className="mx-auto mt-5 max-w-xl text-base font-semibold italic leading-relaxed text-muted-foreground lg:mx-0">“Wujudkan Masa Depan Cerah Bersama Kami”</p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <a href="#daftar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3 text-sm font-extrabold text-navy shadow-glow transition hover:-translate-y-0.5">Daftar Sekarang<ArrowRight className="h-5 w-5" /></a>
                <Link to="/lacak" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-7 py-3 text-sm font-bold text-primary backdrop-blur transition hover:border-primary">Cek Status Pendaftaran</Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />Pendaftaran online gratis</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />Data aman dan rahasia</span>
              </div>
            </div>
            <div className="order-3 reveal mx-auto w-full max-w-md lg:order-2 lg:max-w-none" style={{ animationDelay: "120ms" }}>
              <FormCepat onLanjut={lanjutDariFormCepat} dibuka={pendaftaranDibuka} />
            </div>
            <div className="order-2 lg:order-3 lg:col-span-2">
              <img
                key={ta.header_url || "bawaan"}
                src={ta.header_url || imgHeader}
                alt="Siswa SMK Muhammadiyah 1 Paguyangan praktik robotika di laboratorium"
                width={2373}
                height={852}
                className="aspect-[791/284] w-full rounded-3xl border border-primary/10 object-cover object-center shadow-glow"
              />
            </div>
          </div>
          <div className="h-3 w-full bg-gradient-to-r from-primary via-primary to-gold" />
        </section>

        <section id="alur" className="scroll-mt-24 bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <JudulBagian eyebrow="Mudah dan Cepat" description="Enam langkah sederhana dari pendaftaran hingga resmi menjadi peserta didik baru.">Alur Pendaftaran PPDB</JudulBagian>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3">
              {ALUR.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={a.title} className="relative flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:block sm:p-5 sm:text-center">
                    <span className="absolute right-3 top-3 font-display text-xs font-extrabold text-primary/40">0{i + 1}</span>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary sm:mx-auto sm:h-14 sm:w-14"><Icon className="h-6 w-6" /></span>
                    <div className="min-w-0 sm:mt-4">
                      <h3 className="font-display text-sm font-extrabold text-navy">{a.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.text}</p>
                    </div>
                    {i < ALUR.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gold lg:block" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="jurusan" className="scroll-mt-24 border-y border-border bg-muted py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <JudulBagian eyebrow="Pilih Masa Depanmu" description="Lima program keahlian dengan pembelajaran praktik, pembinaan karakter, dan keterampilan siap kerja.">Program Keahlian</JudulBagian>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {JURUSAN.map((j, i) => (
                <article key={j.k} className="reveal group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="relative overflow-hidden">
                    <img src={(ta as Record<string, unknown>)[`foto_${j.k.toLowerCase()}`] as string || j.img} alt={`Kegiatan ${j.n}`} loading="lazy" width={1024} height={768} decoding="async" className="aspect-[4/3] w-full bg-muted object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute bottom-3 left-3 rounded-lg bg-gold px-3 py-1 font-display text-sm font-extrabold text-navy shadow-sm">{j.k}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="min-h-10 font-display text-sm font-extrabold leading-snug text-navy">{j.n}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{j.d}</p>
                    <a href="#daftar" className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline">Pilih jurusan<ArrowRight className="h-3.5 w-3.5" /></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="informasi" className="scroll-mt-24 bg-background py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><FileCheck2 className="h-6 w-6" /></span>
                <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Informasi PPDB</p><h2 className="font-display text-2xl font-extrabold text-navy">Jadwal Pendaftaran</h2></div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-primary"><CalendarDays className="h-4 w-4" />Gelombang saat ini</p>
                  <p className="mt-2 font-display text-lg font-extrabold text-navy">{gAktif?.nama ?? next?.nama ?? "Jadwal PPDB"}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{gAktif ? `Dibuka hingga ${fmtTgl(gAktif.selesai)}` : next ? `Dibuka ${fmtTgl(next.mulai)}` : "Lihat jadwal lengkap di bawah"}</p>
                </div>
                <div className="rounded-2xl bg-sun p-4">
                  <p className="flex items-center gap-2 text-xs font-bold text-navy"><ClipboardCheck className="h-4 w-4" />Status pendaftaran</p>
                  <p className="mt-2 font-display text-lg font-extrabold text-navy">{pendaftaranDibuka ? "Dibuka" : "Ditutup sementara"}</p>
                  <p className="mt-1 text-xs leading-relaxed text-navy/70">{pendaftaranDibuka ? "Formulir online dapat diisi sekarang" : "Nantikan gelombang berikutnya"}</p>
                </div>
              </div>
              <a href="#jadwal" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:underline">Lihat jadwal dan syarat lengkap<ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="relative isolate overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground shadow-glow sm:p-9">
              <div className="absolute -right-14 -top-14 -z-10 h-48 w-48 rounded-full border-[28px] border-gold/25" />
              <GraduationCap className="h-12 w-12 text-gold" />
              <p className="mt-5 font-accent text-3xl font-bold text-gold">Jangan Lewatkan Kesempatan Ini!</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight">Saatnya Melangkah Menuju Masa Depan</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-85">Daftarkan diri Anda dan kembangkan potensi terbaik bersama SMK Muhammadiyah 1 Paguyangan.</p>
              <a href="#daftar" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-extrabold text-navy transition hover:-translate-y-0.5"><Send className="h-4 w-4" />Daftar Sekarang<ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
        </section>

        <section id="prestasi" className="border-y border-border bg-sky py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <JudulBagian eyebrow="Bukti Nyata" description="Prestasi siswa menjadi bagian dari semangat belajar, berkarya, dan berakhlak mulia.">Prestasi Sekolah</JudulBagian>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRESTASI.map((p) => (
                <article key={p.j} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-gold">
                  <div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun text-gold"><Trophy className="h-5 w-5" /></span><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-primary">{p.l} · {p.t}</span></div>
                  <h3 className="mt-4 text-sm font-bold leading-relaxed text-navy">{p.j}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="instagram" className="bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <JudulBagian eyebrow="Kabar Sekolah" description={`Lihat kegiatan dan kabar terbaru melalui Instagram @${INSTAGRAM}.`}>Ikuti Instagram Kami</JudulBagian>
            <iframe title="Instagram SMK Muhammadiyah 1 Paguyangan" src={`https://www.instagram.com/${INSTAGRAM}/embed`} className="mx-auto mt-8 h-[560px] w-full max-w-md rounded-2xl border border-border bg-card shadow-sm" loading="lazy" />
            <a href={`https://www.instagram.com/${INSTAGRAM}/`} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"><Instagram className="h-4 w-4" />Buka Instagram</a>
          </div>
        </section>

        <section id="jadwal" className="scroll-mt-24 border-y border-border bg-muted py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <JudulBagian eyebrow="Catat Tanggalnya">Jadwal & Syarat Pendaftaran</JudulBagian>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {jadwal.map((j, i) => {
                const aktif = j.st === "dibuka";
                const label = j.st ? LABEL_JADWAL[j.st] : "";
                return (
                  <li key={j.nama + i} className={`rounded-2xl border p-5 shadow-sm ${aktif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"} ${j.st === "selesai" ? "opacity-65" : ""}`}>
                    <div className="flex items-center justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold ${aktif ? "bg-gold text-navy" : "bg-secondary text-primary"}`}>{i + 1}</span>{label && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${aktif ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</span>}</div>
                    <h3 className="mt-4 font-display text-base font-extrabold">{j.nama}</h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${aktif ? "opacity-85" : "text-muted-foreground"}`}>{j.tgl}</p>
                  </li>
                );
              })}
            </ol>
            <div id="syarat" className="mx-auto mt-8 max-w-4xl scroll-mt-28 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><ClipboardCheck className="h-6 w-6" /></span><h3 className="font-display text-2xl font-extrabold text-navy">Syarat Pendaftaran</h3></div>
              <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                {daftarSyarat(ta.syarat).map((x, i) => <li key={x + i} className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span><span className="pt-0.5">{x}</span></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section id="daftar" className="scroll-mt-24 bg-sky py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <JudulBagian eyebrow="Ayo Bergabung" description="Lengkapi data calon peserta didik, unggah berkas, periksa ringkasan, lalu kirim pendaftaran.">Formulir Pendaftaran</JudulBagian>
            <RegForm tahunAjaran={ta.tahun_ajaran} dibuka={pendaftaranDibuka} gelombang={gAktif?.nama} info={!gAktif && next ? `Gelombang berikutnya: ${next.nama}, dibuka ${fmtTgl(next.mulai)}.` : ""} wajibBerkas={ta.wajib_berkas !== false} telepon={telepon} dataAwal={dataAwal} />
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <JudulBagian eyebrow="Pertanyaan Umum">Yang Sering Ditanyakan</JudulBagian>
            <div className="mt-9 grid gap-3">
              {faq.map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-sm open:border-primary/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-navy">{q}<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-lg text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="kontak" className="scroll-mt-24 border-t border-border bg-muted py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Hubungi Panitia</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-navy">Alamat & Kontak</h2>
              <dl className="mt-6 grid gap-5 text-sm">
                <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Alamat sekolah</dt><dd className="mt-1 font-semibold leading-relaxed">{alamat}</dd></div></div>
                <div className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Telepon</dt><dd className="mt-1 font-semibold"><a href={`tel:${telepon.replace(/[^\d+]/g, "")}`} className="hover:text-primary">{telepon}</a></dd></div></div>
                <div className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 break-all font-semibold"><a href={`mailto:${email}`} className="hover:text-primary">{email}</a></dd></div></div>
              </dl>
              <a href={mapsLink} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"><MapPin className="h-4 w-4" />Buka di Google Maps</a>
            </div>
            <iframe title="Lokasi SMK Muhammadiyah 1 Paguyangan" src={mapsEmbed(ta.maps_url, alamat)} className="min-h-80 w-full rounded-3xl border border-border bg-card shadow-sm" loading="lazy" />
          </div>
        </section>
      </main>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
          <div className="flex items-center gap-3"><Logo src={ta.logo_url} className="h-12 w-12 shrink-0" /><div><p className="font-display text-sm font-extrabold">SMK MUHAMMADIYAH 1 PAGUYANGAN</p><p className="mt-1 text-xs opacity-70">Berakhlak Mulia, Berprestasi</p></div></div>
          <div className="text-xs leading-relaxed opacity-80"><p>{alamat}</p><p className="mt-1">{telepon} · {email}</p></div>
          <a href={`https://www.instagram.com/${INSTAGRAM}/`} target="_blank" rel="noreferrer" aria-label="Instagram sekolah" className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-foreground/10 transition hover:bg-gold hover:text-navy"><Instagram className="h-5 w-5" /></a>
        </div>
        <div className="border-t border-navy-foreground/10 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} PPDB SMK Muhammadiyah 1 Paguyangan · SMK Bisa! SMK Hebat!</div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { useTahunAjaran, SEKOLAH_DEFAULT } from "@/lib/tahun";
import { LacakForm } from "@/components/LacakForm";

export const Route = createFileRoute("/lacak")({
  validateSearch: (s: Record<string, unknown>): { no?: string } => (typeof s["no"] === "string" ? { no: s["no"] } : {}),
  head: () => ({
    meta: [
      { title: "Cek Status Pendaftaran — PPDB SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Periksa status pendaftaran dan progres verifikasi berkas PPDB SMK Muhammadiyah 1 Paguyangan dengan nomor pendaftaran." },
      { property: "og:title", content: "Cek Status Pendaftaran PPDB SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Masukkan nomor pendaftaran dan tanggal lahir untuk melihat progres verifikasi berkas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Lacak,
});

function Lacak() {
  const { no } = Route.useSearch();
  const ta = useTahunAjaran();
  const telepon = ta.telepon || SEKOLAH_DEFAULT.telepon;
  return (
    <div className="min-h-screen bg-hero font-sans text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Logo src={ta.logo_url} className="h-8 w-8 shrink-0" />
            <span className="truncate font-display font-bold">SMK Muhammadiyah 1 Paguyangan</span>
          </Link>
          <Link to="/" className="shrink-0 rounded-full border border-border px-4 py-2 text-sm">Beranda</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">PPDB {ta.tahun_ajaran}</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Cek Status Pendaftaran</h1>
        <p className="mt-2 text-muted-foreground">Lihat sejauh mana berkas Anda sudah diperiksa panitia, cukup dengan nomor pendaftaran dari halaman konfirmasi.</p>
        <div className="mt-6"><LacakForm awal={no ?? ""} /></div>
        <p className="mt-6 rounded-lg bg-card/80 p-3 text-sm text-muted-foreground">Lupa nomor pendaftaran? Hubungi panitia di <a href={`tel:${telepon.replace(/[^\d+]/g, "")}`} className="font-medium text-primary">{telepon}</a>.</p>
      </main>
    </div>
  );
}

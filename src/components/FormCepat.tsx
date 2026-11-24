import { useState } from "react";
import { ArrowRight, CalendarDays, GraduationCap, LockKeyhole, Phone, UserRound } from "lucide-react";

export type DataCepat = {
  nama: string;
  tanggal_lahir: string;
  jurusan: string;
  no_hp: string;
};

const PILIHAN_JURUSAN = [
  "Teknik Kendaraan Ringan",
  "Teknik Sepeda Motor",
  "Teknik Ototronik",
  "Rekayasa Perangkat Lunak",
  "Broadcasting dan Perfilman",
];

const fieldCls = "w-full border-0 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0";

export function FormCepat({ onLanjut, dibuka }: { onLanjut: (data: DataCepat) => void; dibuka: boolean }) {
  const [data, setData] = useState<DataCepat>({ nama: "", tanggal_lahir: "", jurusan: "", no_hp: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof DataCepat) => (e: { target: { value: string } }) => setData((lama) => ({ ...lama, [k]: e.target.value }));

  function lanjut(e: React.FormEvent) {
    e.preventDefault();
    if (!data.nama.trim() || !data.tanggal_lahir || !data.jurusan || !data.no_hp.trim()) {
      setErr("Lengkapi keempat data di atas untuk melanjutkan.");
      return;
    }
    setErr("");
    onLanjut({ nama: data.nama.trim(), tanggal_lahir: data.tanggal_lahir, jurusan: data.jurusan, no_hp: data.no_hp.trim() });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-glow">
      <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground sm:px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15"><GraduationCap className="h-6 w-6" /></span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">Formulir Pendaftaran PPDB</h2>
          <p className="mt-0.5 text-xs opacity-80">Mulai dengan empat data singkat</p>
        </div>
      </div>
      <form onSubmit={lanjut} className="p-5 sm:p-6" noValidate>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Isi data awal, kemudian lengkapi formulir pendaftaran di bawah.</p>
        <div className="grid gap-3">
          <label className="flex items-center rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <UserRound className="ml-4 h-5 w-5 shrink-0 text-primary" />
            <span className="sr-only">Nama lengkap</span>
            <input aria-label="Nama lengkap formulir cepat" value={data.nama} onChange={set("nama")} placeholder="Nama lengkap calon siswa" autoComplete="name" className={fieldCls} />
          </label>
          <label className="flex items-center rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <CalendarDays className="ml-4 h-5 w-5 shrink-0 text-primary" />
            <span className="sr-only">Tanggal lahir</span>
            <input aria-label="Tanggal lahir formulir cepat" value={data.tanggal_lahir} onChange={set("tanggal_lahir")} type="date" className={fieldCls} />
          </label>
          <label className="flex items-center rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <GraduationCap className="ml-4 h-5 w-5 shrink-0 text-primary" />
            <span className="sr-only">Program keahlian</span>
            <select aria-label="Program keahlian formulir cepat" value={data.jurusan} onChange={set("jurusan")} className={`${fieldCls} ${data.jurusan ? "" : "text-muted-foreground"}`}>
              <option value="">Pilih program keahlian</option>
              {PILIHAN_JURUSAN.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </label>
          <label className="flex items-center rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <Phone className="ml-4 h-5 w-5 shrink-0 text-primary" />
            <span className="sr-only">Nomor HP atau WhatsApp</span>
            <input aria-label="Nomor WhatsApp formulir cepat" value={data.no_hp} onChange={set("no_hp")} inputMode="tel" autoComplete="tel" placeholder="Nomor HP / WhatsApp" className={fieldCls} />
          </label>
        </div>
        {err && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{err}</p>}
        <button type="submit" disabled={!dibuka} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50">
          {dibuka ? "Lanjutkan Pendaftaran" : "Pendaftaran Ditutup"}<ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" />Data Anda aman dan hanya digunakan untuk PPDB</p>
      </form>
    </div>
  );
}

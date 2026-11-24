import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import { buatNoDaftar, pesanGagalKirim } from "@/lib/pendaftaran";
import { SEKOLAH_DEFAULT, gelombangAktif, type Gelombang } from "@/lib/tahun";
import { BERKAS, DATA_KOSONG, JUMLAH_TAHAP, MAKS_BERKAS, kolomTakDikenal, validasiTahap, type DataPendaftar, type Galat, type KunciBerkas } from "@/lib/formulir";

const JURUSAN = [
  { k: "TKR", n: "Teknik Kendaraan Ringan", d: "Perawatan, perbaikan, dan diagnosis sistem mekanik serta kelistrikan mobil." },
  { k: "TSM", n: "Teknik Sepeda Motor", d: "Perawatan, servis, perbaikan mesin, dan kelistrikan sepeda motor." },
  { k: "TOTR", n: "Teknik Ototronik", d: "Sistem elektronik, kontrol, dan kelistrikan modern pada kendaraan." },
  { k: "RPL", n: "Rekayasa Perangkat Lunak", d: "Merancang, membuat, menguji, dan memelihara aplikasi atau perangkat lunak." },
  { k: "BDF", n: "Broadcasting dan Perfilman", d: "Produksi konten audio-visual: sinematografi, penyutradaraan, dan penyiaran." },
];
const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary";
const galatCls = "border-destructive";
const STEPS = ["Data Diri", "Sekolah & Jurusan", "Unggah Berkas", "Ringkasan"] as const;
type Step = (typeof STEPS)[number];
const fmtTanggal = (v: string) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-");

type Berkas = Partial<Record<KunciBerkas, File>>;
type Setel = (k: keyof DataPendaftar) => (e: { target: { value: string } }) => void;
/** Gelombang yang dibuka hari ini menurut tabel gelombang; null bila tidak terbaca. */
async function gelombangHariIni(ta: string): Promise<Pick<Gelombang, "id" | "nama"> | null> {
  try {
    const { data } = await supabase.from("gelombang").select("*").eq("tahun_ajaran", ta);
    const g = gelombangAktif((data ?? []) as Gelombang[]);
    return g ? { id: g.id, nama: g.nama } : null;
  } catch {
    return null;
  }
}

type Terkirim = { no: string; nama: string; nisn: string; jurusan: string; no_hp: string; gelombang?: string | undefined; tanggal: string };

export function RegForm({ tahunAjaran, dibuka = true, wajibBerkas = true, gelombang, info = "", telepon = SEKOLAH_DEFAULT.telepon, dataAwal }: { tahunAjaran: string; dibuka?: boolean; wajibBerkas?: boolean; gelombang?: string | undefined; info?: string; telepon?: string; dataAwal?: Partial<DataPendaftar> | undefined }) {
  // Satu tahap tampil dalam satu waktu (1–4); semua jawaban tersimpan di `data` agar tidak hilang saat berpindah tahap.
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<DataPendaftar>(DATA_KOSONG);
  const [files, setFiles] = useState<Berkas>({});
  const [galat, setGalat] = useState<Galat>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Terkirim | null>(null);
  // Saat calon siswa mengubah jawaban dari ringkasan, "Lanjut" langsung kembali ke ringkasan.
  const [dariRingkasan, setDariRingkasan] = useState(false);
  const atasRef = useRef<HTMLDivElement>(null);
  const cur: Step = STEPS[currentStep - 1] ?? "Data Diri";

  // Data dari formulir singkat di atas langsung mengisi tahap 1.
  useEffect(() => {
    if (!dataAwal) return;
    setData((lama) => ({ ...lama, ...dataAwal }));
    setCurrentStep(1);
    setDone(null);
    setErr("");
    setGalat({});
    setDariRingkasan(false);
  }, [dataAwal]);

  const keAtas = () => window.setTimeout(() => atasRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 30);

  const set: Setel = (k) => (e) => {
    const v = e.target.value;
    setData((lama) => ({ ...lama, [k]: v, ...(k === "jurusan" && lama.jurusan_2 === v ? { jurusan_2: "" } : {}) }));
    setGalat((g) => (g[k] ? { ...g, [k]: undefined } : g));
  };

  function ubah(s: Step) {
    setErr("");
    setGalat({});
    setDariRingkasan(true);
    setCurrentStep(STEPS.indexOf(s) + 1);
    keAtas();
  }

  async function pick(k: KunciBerkas, f?: File) {
    if (!f) return;
    setErr("");
    const hanyaFoto = k === "foto";
    const ok = f.type.startsWith("image/") || (!hanyaFoto && f.type === "application/pdf");
    if (!ok) return setGalat((g) => ({ ...g, [k]: hanyaFoto ? "Pas foto harus berupa gambar (JPG, PNG, atau WebP)." : "Format harus gambar (JPG, PNG, WebP) atau PDF." }));
    setBusy(k);
    try {
      const c = await compressImage(f);
      if (c.size > MAKS_BERKAS) setGalat((g) => ({ ...g, [k]: `${f.name} lebih dari 4 MB. Gunakan berkas yang lebih kecil.` }));
      else {
        setFiles((p) => ({ ...p, [k]: c }));
        setGalat((g) => ({ ...g, [k]: undefined }));
      }
    } catch {
      setGalat((g) => ({ ...g, [k]: "Gagal memproses berkas. Coba berkas lain." }));
    } finally {
      setBusy(null);
    }
  }

  function hapus(k: KunciBerkas) {
    setFiles((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  }

  function lanjut() {
    const g = validasiTahap(currentStep, data, files, wajibBerkas);
    if (Object.keys(g).length) {
      setGalat(g);
      setErr("Masih ada isian wajib yang belum benar. Periksa kolom yang ditandai merah.");
      return;
    }
    setGalat({});
    setErr("");
    if (dariRingkasan) {
      setDariRingkasan(false);
      setCurrentStep(JUMLAH_TAHAP);
    } else setCurrentStep((prev) => Math.min(prev + 1, JUMLAH_TAHAP));
    keAtas();
  }

  function kembali() {
    setErr("");
    setGalat({});
    setDariRingkasan(false);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    keAtas();
  }

  async function submit() {
    const g = validasiTahap(4, data, files, wajibBerkas);
    if (Object.keys(g).length) {
      setGalat(g);
      return setErr("Masih ada jawaban yang belum lengkap. Periksa kembali ringkasan.");
    }
    setErr("");
    setBusy("submit");
    try {
      const no = buatNoDaftar(tahunAjaran, JURUSAN.find((j) => j.n === data.jurusan)?.k ?? "");
      const gel = (await gelombangHariIni(tahunAjaran)) ?? (gelombang ? { id: "", nama: gelombang } : null);
      const paths: Record<string, string> = {};
      for (const d of BERKAS) {
        const f = files[d.k];
        if (!f) continue;
        const ext = f.type === "application/pdf" ? "pdf" : "webp";
        const path = `${no}/${d.k}.${ext}`;
        const { error } = await supabase.storage.from("berkas").upload(path, f, { contentType: f.type });
        if (error) throw error;
        paths[`berkas_${d.k}`] = path;
      }
      const isian = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ""));
      const row: Record<string, unknown> = { ...isian, ...paths, tahun_ajaran: tahunAjaran, ...(gel ? { gelombang: gel.nama, ...(gel.id ? { gelombang_id: gel.id } : {}) } : {}), no_daftar: no };
      // Kolom baru (mis. agama, berkas_kip) belum dibuat di database: lewati kolom itu agar calon siswa tetap bisa mendaftar.
      for (let i = 0; ; i++) {
        const { error } = await supabase.from("pendaftar").insert(row as never);
        if (!error) break;
        const kolom = kolomTakDikenal(error.message);
        if (!kolom || !(kolom in row) || kolom === "nama" || i > 15) throw error;
        delete row[kolom];
      }
      setDone({ no, nama: data.nama, nisn: data.nisn, jurusan: data.jurusan, no_hp: data.no_hp, gelombang: gel?.nama, tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) });
    } catch (e) {
      setErr(pesanGagalKirim(e));
    } finally {
      setBusy(null);
    }
  }

  if (!dibuka)
    return <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Pendaftaran Tahun Ajaran {tahunAjaran} sedang ditutup.{info && <><br />{info}</>}</div>;

  if (done)
    return <Konfirmasi d={done} wajibBerkas={wajibBerkas} telepon={telepon} onLagi={() => { setDone(null); setData(DATA_KOSONG); setFiles({}); setGalat({}); setCurrentStep(1); setDariRingkasan(false); }} />;

  return (
    <div ref={atasRef} className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:mt-10 sm:p-6 md:p-8">
      {gelombang && <p className="mb-4 text-center text-sm font-medium text-primary">Pendaftaran {gelombang} sedang dibuka</p>}
      <p aria-live="polite" className="mb-3 text-sm font-semibold text-primary">Tahap {currentStep} dari {JUMLAH_TAHAP} <span className="font-normal text-muted-foreground">· {cur}</span></p>
      <ol className="mb-8 flex gap-2" aria-label={`Tahap ${currentStep} dari ${JUMLAH_TAHAP}`}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
            <p className={`mt-2 text-[11px] leading-tight sm:text-xs ${i === currentStep - 1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>{i + 1}. {s}</p>
          </li>
        ))}
      </ol>

      {currentStep === 1 && <TahapDataDiri data={data} set={set} galat={galat} />}
      {currentStep === 2 && <TahapSekolah data={data} set={set} galat={galat} tahunAjaran={tahunAjaran} />}
      {currentStep === 3 && <TahapBerkas wajibBerkas={wajibBerkas} files={files} galat={galat} busy={busy} onPilih={pick} onHapus={hapus} />}
      {currentStep === 4 && <TahapRingkasan data={data} files={files} onUbah={ubah} />}

      {err && <div role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      <div className="mt-6 flex justify-between gap-3">
        <button type="button" disabled={currentStep === 1 || !!busy} onClick={kembali} className="min-h-11 rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40 sm:px-6">Kembali</button>
        {currentStep < JUMLAH_TAHAP ? (
          <button type="button" disabled={!!busy} onClick={lanjut} className="min-h-11 flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:flex-none sm:px-6">{dariRingkasan ? "Kembali ke Ringkasan" : "Lanjut"}</button>
        ) : (
          <button type="button" disabled={!!busy} aria-busy={busy === "submit"} onClick={submit} className="min-h-11 flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:flex-none sm:px-6">
            {busy === "submit" ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Mengirim pendaftaran...
              </span>
            ) : "Kirim Pendaftaran"}
          </button>
        )}
      </div>
    </div>
  );
}

function Pesan({ id, teks }: { id: string; teks?: string | undefined }) {
  return teks ? <p id={id} className="mt-1 text-sm text-destructive">{teks}</p> : null;
}

function Kolom({ label, wajib, galat, id, className = "", children }: { label: string; wajib?: boolean; galat?: string | undefined; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}{wajib && <span className="text-destructive"> *</span>}</label>
      {children}
      <Pesan id={`${id}-galat`} teks={galat} />
    </div>
  );
}

function TahapDataDiri({ data, set, galat }: { data: DataPendaftar; set: Setel; galat: Galat }) {
  const a = (k: keyof DataPendaftar) => ({ id: `f-${k}`, "aria-invalid": !!galat[k], "aria-describedby": galat[k] ? `f-${k}-galat` : undefined });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Kolom label="Nama lengkap" wajib id="f-nama" galat={galat.nama} className="md:col-span-2">
        <input {...a("nama")} value={data.nama} onChange={set("nama")} maxLength={100} autoComplete="name" placeholder="Nama lengkap" className={`${inputCls} ${galat.nama ? galatCls : ""}`} />
      </Kolom>
      <Kolom label="NISN" wajib id="f-nisn" galat={galat.nisn}>
        <input {...a("nisn")} value={data.nisn} onChange={set("nisn")} inputMode="numeric" maxLength={10} placeholder="NISN (10 angka)" className={`${inputCls} ${galat.nisn ? galatCls : ""}`} />
      </Kolom>
      <Kolom label="Tanggal lahir" wajib id="f-tanggal_lahir" galat={galat.tanggal_lahir}>
        <input {...a("tanggal_lahir")} value={data.tanggal_lahir} onChange={set("tanggal_lahir")} type="date" className={`${inputCls} ${galat.tanggal_lahir ? galatCls : ""}`} />
      </Kolom>
      <Kolom label="Jenis kelamin" id="f-jenis_kelamin">
        <select {...a("jenis_kelamin")} value={data.jenis_kelamin} onChange={set("jenis_kelamin")} className={inputCls}>
          <option value="">Pilih jenis kelamin</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </Kolom>
      <Kolom label="Agama" id="f-agama">
        <select {...a("agama")} value={data.agama} onChange={set("agama")} className={inputCls}>
          <option value="">Pilih agama</option>
          {AGAMA.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Kolom>
      <Kolom label="No. HP / WhatsApp" wajib id="f-no_hp" galat={galat.no_hp} className="md:col-span-2">
        <input {...a("no_hp")} value={data.no_hp} onChange={set("no_hp")} inputMode="tel" maxLength={20} autoComplete="tel" placeholder="No. HP / WhatsApp" className={`${inputCls} ${galat.no_hp ? galatCls : ""}`} />
      </Kolom>
      <Kolom label="Alamat" id="f-alamat" className="md:col-span-2">
        <textarea {...a("alamat")} value={data.alamat} onChange={set("alamat")} rows={3} maxLength={300} placeholder="Alamat lengkap" className={inputCls} />
      </Kolom>
    </div>
  );
}

function TahapSekolah({ data, set, galat, tahunAjaran }: { data: DataPendaftar; set: Setel; galat: Galat; tahunAjaran: string }) {
  const awal = Number(tahunAjaran.match(/\d{4}/)?.[0]) || new Date().getFullYear();
  const tahunLulus = [awal, awal - 1, awal - 2].map(String);
  return (
    <div className="grid gap-4">
      <Kolom label="Nama sekolah asal" wajib id="f-asal_sekolah" galat={galat.asal_sekolah}>
        <input id="f-asal_sekolah" aria-invalid={!!galat.asal_sekolah} value={data.asal_sekolah} onChange={set("asal_sekolah")} maxLength={120} placeholder="Asal SMP/MTs" className={`${inputCls} ${galat.asal_sekolah ? galatCls : ""}`} />
      </Kolom>
      <div className="grid gap-4 sm:grid-cols-2">
        <Kolom label="Kota / kabupaten sekolah" id="f-kota_sekolah">
          <input id="f-kota_sekolah" value={data.kota_sekolah} onChange={set("kota_sekolah")} maxLength={80} placeholder="Contoh: Brebes" className={inputCls} />
        </Kolom>
        <Kolom label="Tahun lulus" id="f-tahun_lulus">
          <select id="f-tahun_lulus" value={data.tahun_lulus} onChange={set("tahun_lulus")} className={inputCls}>
            <option value="">Pilih tahun lulus</option>
            {tahunLulus.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Kolom>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2" aria-invalid={!!galat.jurusan}>
        <legend className="mb-2 text-base font-medium sm:text-sm">Jurusan pilihan 1<span className="text-destructive"> *</span> — bandingkan deskripsinya</legend>
        {JURUSAN.map((j) => {
          const aktif = data.jurusan === j.n;
          return (
            <label
              key={j.k}
              className={`block cursor-pointer rounded-xl border p-4 transition sm:p-3 ${aktif ? "border-primary bg-primary/5 ring-1 ring-primary" : galat.jurusan ? "border-destructive" : "border-input hover:border-primary/60"}`}
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="jurusan" value={j.n} checked={aktif} onChange={set("jurusan")} className="h-5 w-5 shrink-0 accent-primary" />
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-display text-xs font-bold text-primary">{j.k}</span>
                <span className="min-w-0 font-medium leading-tight">{j.n}</span>
              </span>
              <span className="mt-1.5 block pl-7 text-sm leading-snug text-muted-foreground sm:text-xs">{j.d}</span>
            </label>
          );
        })}
        {galat.jurusan && <p className="text-sm text-destructive sm:col-span-2">{galat.jurusan}</p>}
      </fieldset>
      <Kolom label="Jurusan pilihan 2 (opsional)" id="f-jurusan_2">
        <select id="f-jurusan_2" value={data.jurusan_2} onChange={set("jurusan_2")} className={inputCls}>
          <option value="">Tidak memilih jurusan kedua</option>
          {JURUSAN.filter((j) => j.n !== data.jurusan).map((j) => <option key={j.k} value={j.n}>{j.n}</option>)}
        </select>
      </Kolom>
    </div>
  );
}

function TahapBerkas({ wajibBerkas, files, galat, busy, onPilih, onHapus }: { wajibBerkas: boolean; files: Berkas; galat: Galat; busy: string | null; onPilih: (k: KunciBerkas, f?: File) => void; onHapus: (k: KunciBerkas) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!wajibBerkas && <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground sm:col-span-2">Unggah berkas tidak wajib. Anda boleh langsung klik Lanjut lalu membawa berkas asli ke sekretariat PPDB di sekolah.</p>}
      {BERKAS.map((d) => (
        <ItemBerkas key={d.k} k={d.k} label={d.label} wajib={d.wajib && wajibBerkas} accept={d.accept} file={files[d.k]} galat={galat[d.k]} sibuk={busy === d.k} onPilih={onPilih} onHapus={onHapus} />
      ))}
      <p className="text-xs text-muted-foreground sm:col-span-2">Panduan: pas foto wajib berupa gambar; berkas lain boleh gambar atau PDF. Ukuran maksimal 4 MB per berkas. Foto dikompres otomatis dan disimpan sebagai WebP agar unggah lebih cepat & hemat kuota.</p>
    </div>
  );
}

function ItemBerkas({ k, label, wajib, accept, file, galat, sibuk, onPilih, onHapus }: { k: KunciBerkas; label: string; wajib: boolean; accept: string; file?: File | undefined; galat?: string | undefined; sibuk: boolean; onPilih: (k: KunciBerkas, f?: File) => void; onHapus: (k: KunciBerkas) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/") || typeof URL.createObjectURL !== "function") return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div>
      <div className="relative">
        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 pr-12 ${file ? "border-primary/50 bg-primary/5" : galat ? "border-dashed border-destructive" : "border-dashed border-input"}`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs text-muted-foreground">
            {url ? <img src={url} alt={`Pratinjau ${label}`} className="h-full w-full object-cover" /> : file ? "PDF" : "+"}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-medium">{label}{wajib ? <span className="text-destructive"> *</span> : <span className="font-normal text-muted-foreground"> (opsional)</span>} {file && <span className="text-primary">✓</span>}</p>
            <p className="truncate text-xs text-muted-foreground">
              {sibuk ? "Mengompres..." : file ? `${(file.size / 1024).toFixed(0)} KB` : wajib ? "Format: JPG, PNG, atau WebP · Maks. 4 MB" : "Format: JPG, PNG, WebP, atau PDF · Maks. 4 MB"}
            </p>
          </div>
          <input type="file" aria-label={`Unggah ${label}`} accept={accept} className="hidden" onChange={(e) => { onPilih(k, e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {file && (
          <button type="button" onClick={() => onHapus(k)} aria-label={`Hapus ${label}`} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-sm text-muted-foreground hover:border-destructive hover:text-destructive">✕</button>
        )}
      </div>
      <Pesan id={`berkas-${k}-galat`} teks={galat} />
    </div>
  );
}

function TahapRingkasan({ data, files, onUbah }: { data: DataPendaftar; files: Berkas; onUbah: (s: Step) => void }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Periksa kembali jawaban Anda. Tekan <span className="font-medium text-foreground">Ubah</span> untuk memperbaiki sebelum mengirim.</p>
      <Bagian judul="Data Diri" onUbah={() => onUbah("Data Diri")}>
        <Baris label="Nama lengkap" nilai={data.nama} />
        <Baris label="NISN" nilai={data.nisn} />
        <Baris label="Tanggal lahir" nilai={data.tanggal_lahir ? fmtTanggal(data.tanggal_lahir) : ""} />
        <Baris label="Jenis kelamin" nilai={data.jenis_kelamin} opsional />
        <Baris label="Agama" nilai={data.agama} opsional />
        <Baris label="No. HP / WhatsApp" nilai={data.no_hp} />
        <Baris label="Alamat" nilai={data.alamat} opsional />
      </Bagian>
      <Bagian judul="Sekolah & Jurusan" onUbah={() => onUbah("Sekolah & Jurusan")}>
        <Baris label="Asal sekolah" nilai={data.asal_sekolah} />
        <Baris label="Kota / kabupaten" nilai={data.kota_sekolah} opsional />
        <Baris label="Tahun lulus" nilai={data.tahun_lulus} opsional />
        <Baris label="Jurusan pilihan 1" nilai={data.jurusan} />
        <Baris label="Jurusan pilihan 2" nilai={data.jurusan_2} opsional />
      </Bagian>
      <Bagian judul="Unggah Berkas" onUbah={() => onUbah("Unggah Berkas")}>
        {BERKAS.map((d) => {
          const f = files[d.k];
          return <Baris key={d.k} label={d.label} nilai={f ? `✓ ${f.type === "application/pdf" ? "PDF" : "Foto"} · ${(f.size / 1024).toFixed(0)} KB` : ""} opsional={!d.wajib} />;
        })}
      </Bagian>
    </div>
  );
}

function Bagian({ judul, onUbah, children }: { judul: string; onUbah: () => void; children: React.ReactNode }) {
  return (
    <section aria-label={judul} className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-medium">{judul}</h4>
        <button type="button" onClick={onUbah} aria-label={`Ubah ${judul}`} className="rounded-full border border-primary px-4 py-1 text-xs font-medium text-primary">Ubah</button>
      </div>
      <dl className="grid gap-2 text-sm">{children}</dl>
    </section>
  );
}

function Baris({ label, nilai, opsional = false }: { label: string; nilai: string; opsional?: boolean }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`break-words ${nilai ? "" : opsional ? "text-muted-foreground" : "text-destructive"}`}>{nilai || (opsional ? "-" : "Belum diisi")}</dd>
    </div>
  );
}

function Konfirmasi({ d, wajibBerkas, telepon, onLagi }: { d: Terkirim; wajibBerkas: boolean; telepon: string; onLagi: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [salin, setSalin] = useState(false);
  useEffect(() => { ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }); }, []);
  async function salinNo() {
    try { await navigator.clipboard.writeText(d.no); setSalin(true); setTimeout(() => setSalin(false), 2000); } catch { /* clipboard diblokir: nomor tetap terlihat */ }
  }
  const langkah: [string, string][] = [
    ["Simpan nomor pendaftaran", "Salin, foto layar, atau cetak bukti ini. Nomor dipakai untuk cek status, menghubungi panitia, dan daftar ulang."],
    ["Pantau WhatsApp", `Panitia akan menghubungi ${d.no_hp} untuk konfirmasi. Pastikan nomor aktif.`],
    wajibBerkas
      ? ["Tunggu verifikasi berkas", "Panitia memeriksa berkas yang Anda unggah. Jika ada yang kurang jelas, Anda akan dihubungi."]
      : ["Bawa berkas asli ke sekolah", "Pas foto 3x4, Kartu Keluarga, Akta Kelahiran, dan SKL/rapor untuk diverifikasi di sekretariat PPDB."],
    ["Ikuti pengumuman & daftar ulang", `Hasil seleksi diumumkan sesuai jadwal${d.gelombang ? ` ${d.gelombang}` : ""}. Bawa bukti ini saat daftar ulang.`],
  ];
  return (
    <div ref={ref} id="bukti-daftar" role="status" className="mt-8 scroll-mt-24 rounded-2xl border border-primary/30 bg-card p-5 sm:mt-10 sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">✓</div>
        <h3 className="mt-4 font-display text-2xl font-semibold">Pendaftaran Berhasil Terkirim</h3>
        <p className="mt-2 text-muted-foreground">Terima kasih, {d.nama}. Data Anda sudah kami terima.</p>
      </div>
      <div className="mt-6 rounded-xl bg-mint p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nomor Pendaftaran</p>
        <p className="mt-1 break-words font-mono text-2xl font-bold text-primary sm:text-4xl sm:tracking-wider">{d.no}</p>
        <button type="button" onClick={salinNo} className="mt-3 min-h-11 rounded-full border border-primary bg-card px-5 text-sm font-medium text-primary print:hidden">{salin ? "Tersalin ✓" : "Salin Nomor Pendaftaran"}</button>
        <p className="mt-3 text-sm font-medium text-foreground">Simpan nomor ini! Gunakan untuk cek status pendaftaran.</p>
      </div>
      <dl className="mt-5 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {([["Nama", d.nama], ["NISN", d.nisn], ["Jurusan", d.jurusan], ["Tanggal daftar", d.tanggal], ...(d.gelombang ? [["Gelombang", d.gelombang]] : [])] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-border py-1.5 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium sm:text-left">{v}</dd>
          </div>
        ))}
      </dl>
      <h4 className="mt-6 font-display text-lg font-semibold">Langkah selanjutnya</h4>
      <ol className="mt-3 grid gap-3">
        {langkah.map(([j, t], i) => (
          <li key={j} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun font-display font-bold text-sun-foreground">{i + 1}</span>
            <div className="min-w-0"><p className="font-medium">{j}</p><p className="text-sm text-muted-foreground">{t}</p></div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-lg bg-muted p-3 text-sm">Ada pertanyaan? Hubungi panitia PPDB di <a href={`tel:${telepon.replace(/[^\d+]/g, "")}`} className="font-medium text-primary">{telepon}</a> dan sebutkan nomor pendaftaran Anda.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
        <a href={`/lacak?no=${encodeURIComponent(d.no)}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-sun px-6 text-sm font-medium text-sun-foreground">Cek Status Sekarang</a>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Cetak / simpan bukti</button>
        <button type="button" onClick={onLagi} className="min-h-11 rounded-full border border-primary px-6 text-sm font-medium text-primary">Daftarkan siswa lain</button>
      </div>
    </div>
  );
}

const esc = (s: unknown) => String(s ?? "-").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const BERKAS_FISIK = ["Pas Foto 3x4", "Kartu Keluarga (KK)", "Akta Kelahiran", "Ijazah / SKL / Rapor", "KIP / PIP / PKH (jika ada)", "Formulir pendaftaran"];

export function cetakLembar(r0: Record<string, unknown> | null, o: { ta?: string | undefined; logo?: string | null | undefined; petugas: string }) {
  const r = r0 ?? {};
  const baris = (l: string, v: unknown) => `<tr><td class="k">${l}</td><td>: ${r0 ? esc(v) : "......................................................................"}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Lembar Kendali ${r0 ? esc(r["nama"]) : "Blanko"}</title><style>
@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;font-size:11pt;color:#000}
.kop{display:flex;align-items:center;gap:12px;border-bottom:3px double #000;padding-bottom:8px}.kop img{height:60px}
h1{font-size:14pt;margin:0}h2{text-align:center;font-size:13pt;margin:14px 0 8px}
table{width:100%;border-collapse:collapse}.id td{padding:2px 4px}.k{width:150px}
.c th,.c td{border:1px solid #000;padding:6px;text-align:center}.c td:first-child{text-align:left}
.box{border:1px solid #000;height:90px;margin-top:4px}.ttd{display:flex;justify-content:space-between;margin-top:30px;text-align:center}
.ttd div{width:45%}.sp{height:70px}</style></head><body>
<div class="kop">${o.logo ? `<img src="${esc(o.logo)}">` : ""}<div><h1>SMK Muhammadiyah 1 Paguyangan</h1><div>Panitia PPDB Tahun Ajaran ${esc(o.ta ?? r["tahun_ajaran"])}</div></div></div>
<h2>LEMBAR KENDALI VERIFIKASI BERKAS FISIK</h2>
<table class="id">${baris("No. Pendaftaran", r["no_daftar"])}${baris("Nama", r["nama"])}${baris("NISN", r["nisn"])}${baris("Tanggal lahir", r["tanggal_lahir"])}${baris("Jenis kelamin", r["jenis_kelamin"])}${baris("Agama", r["agama"])}${baris("Asal sekolah", r["asal_sekolah"])}${baris("Kota sekolah", r["kota_sekolah"])}${baris("Tahun lulus", r["tahun_lulus"])}${baris("Jurusan pilihan 1", r["jurusan"])}${baris("Jurusan pilihan 2", r["jurusan_2"])}${baris("No. HP", r["no_hp"])}${baris("Alamat", r["alamat"])}</table>
<p><b>Checklist berkas</b></p>
<table class="c"><tr><th>Berkas</th><th>Asli</th><th>Fotokopi</th><th>Keterangan</th></tr>
${BERKAS_FISIK.map((b) => `<tr><td>${b}</td><td>☐</td><td>☐</td><td style="width:35%"></td></tr>`).join("")}</table>
<p><b>Catatan petugas</b></p><div class="box">${r["catatan"] ? `<div style="padding:6px">${esc(r["catatan"])}</div>` : ""}</div>
<p>Paguyangan, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
<div class="ttd"><div>Orang Tua / Wali<div class="sp"></div>(.................................)</div><div>Petugas Verifikasi<div class="sp"></div>(${o.petugas ? esc(o.petugas) : "................................."})</div></div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html); w.document.close();
  return true;
}

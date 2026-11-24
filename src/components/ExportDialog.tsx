import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Gelombang } from "@/lib/tahun";
import { KOLOM, KOLOM_AWAL, laporanSementara, pindah } from "@/lib/ekspor";

type Row = Record<string, unknown>;
const lbl = (k: string) => KOLOM.find((c) => c.k === k)?.label ?? k;
const val = (r: Row, k: string) => { const v = r[k]; if (v == null) return ""; if (k === "created_at") return new Date(String(v)).toLocaleString("id-ID"); return String(v); };

export function ExportDialog({ rows, ta, gel, petugas, onClose }: { rows: Row[]; ta: string; gel: string; petugas: string; onClose: () => void }) {
  const [cols, setCols] = useState<string[]>(() => { try { const s = JSON.parse(localStorage.getItem("ekspor_kolom") || "null"); if (Array.isArray(s) && s.length) return s; } catch { /* */ } return KOLOM_AWAL; });
  const [gelList, setGelList] = useState<Gelombang[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { localStorage.setItem("ekspor_kolom", JSON.stringify(cols)); }, [cols]);
  useEffect(() => { let q = supabase.from("gelombang").select("*"); if (ta) q = q.eq("tahun_ajaran", ta); q.then(({ data }) => setGelList((data ?? []) as Gelombang[])); }, [ta]);
  const sementara = laporanSementara(gelList, gel);
  const sisa = KOLOM.filter((c) => !cols.includes(c.k));

  async function unduh(fmt: "xlsx" | "pdf") {
    if (!cols.length) return;
    setBusy(true);
    const tgl = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" }) + " WIB";
    const gelTxt = gel === "-" ? "Tanpa gelombang" : gel || "Semua gelombang";
    const judul = (sementara ? "LAPORAN SEMENTARA — " : "") + "Daftar Pendaftar PPDB SMK Muhammadiyah 1 Paguyangan";
    const meta = [["Tahun Ajaran", ta || "Semua"], ["Gelombang", gelTxt], ["Tanggal Export", tgl], ["Diexport oleh", petugas || "-"], ["Jumlah", String(rows.length)], ["Status Laporan", sementara ? "SEMENTARA (gelombang belum ditutup)" : "FINAL"]];
    const head = ["No", ...cols.map(lbl)];
    const body = rows.map((r, i) => [String(i + 1), ...cols.map((c) => val(r, c))]);
    const name = `pendaftar-${(ta || "semua").replace("/", "-")}${gel ? "-" + gel.replace(/\s+/g, "-") : ""}${sementara ? "-SEMENTARA" : ""}`;
    let blob: Blob;
    if (fmt === "xlsx") {
      const XLSX = await import("xlsx");
      const aoa = [[judul], ...meta, [], head, ...body];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = head.map((h, i) => ({ wch: Math.min(40, Math.max(h.length, ...body.map((b) => (b[i] ?? "").length), 4) + 2) }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pendaftar");
      blob = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    } else {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: cols.length > 6 ? "landscape" : "portrait" });
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(13); doc.text(judul, 14, 15);
      doc.setFontSize(9); meta.forEach(([k, v], i) => doc.text(`${k}: ${v}`, 14, 22 + i * 4.5));
      autoTable(doc, { startY: 22 + meta.length * 4.5 + 2, head: [head], body, styles: { fontSize: 8 }, headStyles: { fillColor: [34, 110, 60] },
        didDrawPage: () => {
          const h = doc.internal.pageSize.getHeight();
          doc.setFontSize(7); doc.setTextColor(120);
          doc.text(`Diexport ${tgl} oleh ${petugas || "-"}${sementara ? " · LAPORAN SEMENTARA" : ""}`, 14, h - 6);
          if (sementara) { doc.setFontSize(40); doc.setTextColor(230, 200, 200); doc.text("SEMENTARA", w / 2, h / 2, { align: "center", angle: 30 }); }
          doc.setTextColor(0);
        } });
      blob = doc.output("blob");
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}.${fmt}`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    setBusy(false);
  }

  const b = "rounded border border-border px-2 py-1 text-xs disabled:opacity-30";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Unduh daftar pendaftar" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Unduh daftar pendaftar</h2><button onClick={onClose} aria-label="Tutup" className="text-xl">×</button></div>
        <p className="mt-1 text-xs text-muted-foreground">{rows.length} pendaftar · {ta || "Semua tahun"} · {gel === "-" ? "Tanpa gelombang" : gel || "Semua gelombang"} · oleh {petugas || "-"}</p>
        {sementara && <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">Gelombang belum ditutup — file akan diberi label LAPORAN SEMENTARA.</p>}
        <p className="mt-4 text-sm font-medium">Kolom & urutan</p>
        <ol className="mt-2 grid gap-1">
          {cols.map((c, i) => (
            <li key={c} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
              <span className="w-5 text-muted-foreground">{i + 1}.</span><span className="flex-1">{lbl(c)}</span>
              <button className={b} disabled={i === 0} onClick={() => setCols(pindah(cols, i, -1))} aria-label={`Naikkan ${lbl(c)}`}>↑</button>
              <button className={b} disabled={i === cols.length - 1} onClick={() => setCols(pindah(cols, i, 1))} aria-label={`Turunkan ${lbl(c)}`}>↓</button>
              <button className={`${b} text-destructive`} onClick={() => setCols(cols.filter((x) => x !== c))} aria-label={`Hapus ${lbl(c)}`}>✕</button>
            </li>))}
          {!cols.length && <li className="text-xs text-destructive">Pilih minimal satu kolom.</li>}
        </ol>
        {sisa.length > 0 && <><p className="mt-3 text-xs text-muted-foreground">Tambah kolom:</p>
          <div className="mt-1 flex flex-wrap gap-1">{sisa.map((c) => <button key={c.k} onClick={() => setCols([...cols, c.k])} className="rounded-full border border-dashed border-border px-3 py-1 text-xs">+ {c.label}</button>)}</div></>}
        <button onClick={() => setCols(KOLOM_AWAL)} className="mt-3 text-xs text-primary underline">Kembalikan kolom bawaan</button>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button disabled={busy || !cols.length} onClick={() => unduh("xlsx")} className="rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">Unduh Excel</button>
          <button disabled={busy || !cols.length} onClick={() => unduh("pdf")} className="rounded-full border border-primary py-2.5 text-sm font-medium text-primary disabled:opacity-50">Unduh PDF</button>
        </div>
      </div>
    </div>
  );
}

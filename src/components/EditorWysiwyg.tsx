import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Link2, Eraser } from "lucide-react";
import { bersihkanHtml } from "@/lib/konten";

const ALAT = [
  ["bold", "Tebal", Bold], ["italic", "Miring", Italic], ["insertUnorderedList", "Daftar poin", List], ["insertOrderedList", "Daftar nomor", ListOrdered],
  ["link", "Tautan", Link2], ["removeFormat", "Hapus format", Eraser],
] as const;

export function EditorWysiwyg({ value, onChange, placeholder, label }: { value: string; onChange: (html: string) => void; placeholder?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const cek = () => {
      const el = ref.current;
      if (!el || !el.contains(document.getSelection()?.anchorNode ?? null)) return setAktif({});
      const a: Record<string, boolean> = {};
      for (const c of ["bold", "italic", "insertUnorderedList", "insertOrderedList"]) a[c] = document.queryCommandState(c);
      setAktif(a);
    };
    document.addEventListener("selectionchange", cek);
    return () => document.removeEventListener("selectionchange", cek);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = bersihkanHtml(value);
  }, [value]);
  const emit = () => { const h = ref.current?.innerHTML ?? ""; onChange(ref.current?.textContent?.trim() ? h : ""); };
  function jalankan(cmd: string) {
    ref.current?.focus();
    if (cmd === "link") {
      let url = window.prompt("Alamat tautan, mis. wa.me/628xxx atau situs sekolah")?.trim();
      if (url) {
        if (!/^(https?:|mailto:|tel:)/i.test(url)) url = "https://" + url;
        const sel = document.getSelection();
        if (sel && sel.isCollapsed) document.execCommand("insertHTML", false, `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>`);
        else document.execCommand("createLink", false, url);
      }
    } else document.execCommand(cmd);
    emit();
  }
  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background focus-within:border-foreground/40">
      <div role="toolbar" aria-label="Format teks" className="flex flex-wrap gap-0.5 border-b border-border bg-muted/50 p-1">
        {ALAT.map(([cmd, nama, Ikon]) => (
          <button key={cmd} type="button" title={nama} aria-label={nama} aria-pressed={cmd in aktif ? !!aktif[cmd] : undefined} onMouseDown={(e) => e.preventDefault()} onClick={() => jalankan(cmd)} className={`rounded-md p-2 hover:bg-background hover:text-foreground ${aktif[cmd] ? "bg-background text-primary shadow-sm" : "text-foreground/80"}`}>
            <Ikon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref} role="textbox" aria-multiline="true" aria-label={label} contentEditable suppressContentEditableWarning
        data-placeholder={placeholder} onInput={emit} onBlur={emit}
        onPaste={(e) => { e.preventDefault(); const html = e.clipboardData.getData("text/html"); const txt = e.clipboardData.getData("text/plain"); document.execCommand("insertHTML", false, bersihkanHtml(html || txt)); emit(); }}
        className="konten-kaya min-h-32 px-4 py-3 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}

export function KontenKaya({ html, className = "" }: { html: string; className?: string }) {
  return <span className={`konten-kaya ${className}`} dangerouslySetInnerHTML={{ __html: bersihkanHtml(html) }} />;
}

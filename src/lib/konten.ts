// Sanitasi HTML konten dari editor WYSIWYG (berjalan di server & browser).
const TAG_BOLEH = new Set(["b", "strong", "i", "em", "u", "s", "br", "p", "div", "ul", "ol", "li", "a", "h3", "blockquote"]);

function escape(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function adaTag(t: string) {
  return /<[a-z][^>]*>/i.test(t);
}

/** Bersihkan HTML: hanya tag aman, tanpa atribut kecuali href http/https/mailto/tel. Teks polos lama diubah ke HTML. */
export function bersihkanHtml(input: string): string {
  if (!input) return "";
  if (!adaTag(input)) return escape(input).replace(/\n/g, "<br>");
  let s = input.replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!TAG_BOLEH.has(t)) return "";
    if (m.startsWith("</")) return `</${t}>`;
    if (t === "a") {
      const h = /href\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
      const url = (h?.[2] ?? h?.[3] ?? "").trim();
      if (/^(https?:|mailto:|tel:)/i.test(url)) return `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
      return "<a>";
    }
    return t === "br" ? "<br>" : `<${t}>`;
  });
  return s;
}

/** Teks polos dari HTML (untuk hitung karakter). */
export function teksPolos(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
}

import { describe, it, expect } from "vitest";
import { bersihkanHtml, teksPolos } from "@/lib/konten";
describe("konten", () => {
  it("membuang script dan atribut berbahaya", () => {
    expect(bersihkanHtml('<b onclick="x()">Hai</b><script>alert(1)</script><a href="javascript:x">t</a>')).toBe("<b>Hai</b><a>t</a>");
  });
  it("teks polos lama tetap tampil dengan baris baru", () => {
    expect(bersihkanHtml("a<b\nc")).toBe("a&lt;b<br>c");
  });
  it("hitung karakter tanpa tag", () => { expect(teksPolos("<p><b>Halo</b></p>")).toBe("Halo"); });
});

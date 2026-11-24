import { createClient } from "@supabase/supabase-js";
import { createGoogle } from "@ai-sdk/google";
import { generateText, APICallError } from "ai";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase";
import { MAKS_PENGUMUMAN } from "@/lib/tahun";
import { NADA_PENGUMUMAN, rapikanHasil, type NadaPengumuman } from "@/lib/pengumuman-ai";

const MODEL = process.env["GEMINI_MODEL"] || "gemini-3.5-flash";

/** Pastikan pemanggil adalah pengelola yang sedang masuk (dan tidak dinonaktifkan). */
export async function cekPengelola(authHeader: string | undefined): Promise<string | null> {
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return "Sesi admin tidak ditemukan. Silakan masuk ulang.";
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await sb.auth.getUser(token);
  const email = data.user?.email;
  if (error || !email) return "Sesi admin sudah berakhir. Silakan masuk ulang.";
  const { data: p } = await sb.from("pengelola").select("aktif").ilike("email", email).maybeSingle();
  if (p && p.aktif === false) return "Akun pengelola Anda sedang dinonaktifkan.";
  return null;
}

function instruksi(nada: NadaPengumuman, tahunAjaran: string) {
  return [
    "Anda adalah humas SMK Muhammadiyah 1 Paguyangan (Brebes, Jawa Tengah) yang menulis pengumuman PPDB untuk calon siswa dan orang tua.",
    `Tahun ajaran PPDB: ${tahunAjaran}.`,
    "Ubah draf atau poin dari pengelola menjadi satu pengumuman yang jelas, sopan, dan siap ditampilkan di banner situs.",
    `Gaya bahasa: ${NADA_PENGUMUMAN[nada]}. Gunakan Bahasa Indonesia yang baku namun mudah dipahami.`,
    "Aturan:",
    "- Gunakan HANYA fakta dari draf (tanggal, jam, tempat, syarat, kontak). Jangan menambah informasi baru, tanggal, atau nomor telepon yang tidak ada.",
    "- Teks biasa tanpa markdown, tanpa judul, tanpa tanda kutip, dan tanpa awalan 'Pengumuman:'.",
    "- Boleh memakai baris baru atau poin '• ' bila ada beberapa hal penting.",
    `- Panjang maksimal ${Math.round(MAKS_PENGUMUMAN * 0.6)} karakter. Utamakan informasi terpenting di kalimat pertama.`,
    "- Tutup dengan ajakan singkat bila sesuai (misalnya untuk segera mendaftar atau menghubungi panitia).",
    "Balas hanya dengan teks pengumuman.",
  ].join("\n");
}

export async function susunPengumuman(input: { draf: string; nada: NadaPengumuman; tahunAjaran: string }) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return { error: "Fitur AI belum dikonfigurasi." } as const;
  const google = createGoogle({ apiKey });
  try {
    const result = await generateText({
      model: google.chat(MODEL),
      instructions: instruksi(input.nada, input.tahunAjaran),
      messages: [{ role: "user", content: `Draf / poin pengumuman:\n${input.draf.trim()}` }],
      maxRetries: 0,
    });
    const teks = rapikanHasil(result.text);
    if (!teks) return { error: "AI tidak menghasilkan teks. Coba ubah draf Anda lalu susun lagi." } as const;
    return { teks } as const;
  } catch (e) {
    const status = APICallError.isInstance(e) ? e.statusCode : undefined;
    console.error("susunPengumuman gagal", status, e instanceof Error ? e.message : e);
    if (status === 402) return { error: "Kuota AI habis. Tambah kredit AI, lalu coba lagi." } as const;
    if (status === 429) return { error: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi." } as const;
    const pesan = e instanceof Error ? e.message : "";
    if (status === 403 && /billing|free tier/i.test(pesan))
      return {
        error: "Akun Google Gemini belum mengaktifkan pembayaran (billing). Aktifkan di aistudio.google.com/billing, lalu coba lagi.",
      } as const;
    if (status === 400 || status === 401 || status === 403)
      return { error: "Kunci Gemini tidak valid atau tidak punya akses. Periksa GEMINI_API_KEY." } as const;
    if (status === 404) return { error: "Model Gemini tidak tersedia. Periksa GEMINI_MODEL." } as const;
    if (status === 503) return { error: "Model Gemini sedang sibuk. Coba lagi sebentar." } as const;
    return { error: "AI sedang tidak dapat dihubungi. Coba lagi beberapa saat lagi." } as const;
  }
}

import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";
import { NADA_PENGUMUMAN, validasiDraf, type NadaPengumuman } from "@/lib/pengumuman-ai";

/** Kirim token sesi admin (Supabase) sebagai header Authorization. */
const kirimSesiAdmin = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next(token ? { headers: { Authorization: `Bearer ${token}` } } : {});
});

export const susunPengumumanAI = createServerFn({ method: "POST" })
  .middleware([kirimSesiAdmin])
  .inputValidator((d: { draf: string; nada: NadaPengumuman; tahunAjaran?: string }) => {
    if (typeof d?.draf !== "string") throw new Error("Draf tidak valid.");
    const nada: NadaPengumuman = d.nada in NADA_PENGUMUMAN ? d.nada : "resmi";
    return { draf: d.draf, nada, tahunAjaran: String(d.tahunAjaran ?? "").slice(0, 20) };
  })
  .handler(async ({ data }): Promise<{ teks?: string; error?: string }> => {
    const salah = validasiDraf(data.draf);
    if (salah) return { error: salah };
    const { cekPengelola, susunPengumuman } = await import("@/lib/pengumuman-ai.server");
    const tolak = await cekPengelola(getRequestHeader("authorization"));
    if (tolak) return { error: tolak };
    return { ...(await susunPengumuman({ ...data, tahunAjaran: data.tahunAjaran || "berjalan" })) };
  });

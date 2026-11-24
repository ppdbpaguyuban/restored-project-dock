// Compress images in the browser to WebP (quality 0.7 ≈ 30% reduction), max 1600px edge. PDFs pass through unchanged.
export async function compressImage(file: File, maxEdge = 1600, quality = 0.7): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("compress"))), "image/webp", quality),
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

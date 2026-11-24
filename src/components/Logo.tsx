export const LOGO_RESMI = "/logo-smkmutu.webp";

export function Logo({ className = "h-12 w-12", src }: { className?: string; src?: string | null | undefined }) {
  return <img src={src || LOGO_RESMI} alt="Logo SMK Muhammadiyah 1 Paguyangan" className={`${className} object-contain`} decoding="async" />;
}

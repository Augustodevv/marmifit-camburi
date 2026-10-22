import "server-only";

/*
 * Mídias locais conhecidas no build (scripts/media-manifest.ts → next.config.ts).
 * Permite usar a foto "por convenção" (ex.: /images/categorias/<slug>.webp) assim que
 * o arquivo for colocado em public/, e cair na ilustração quando ele não existe.
 */
const manifest: Record<string, string> = JSON.parse(process.env.MEDIA_MANIFEST || "{}");

/** Blur genérico (creme → verde) para imagens externas ou sem blur no manifesto. */
export const DEFAULT_BLUR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 6"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#efe9da"/><stop offset="1" stop-color="#cfdccf"/></linearGradient></defs><rect width="8" height="6" fill="url(#g)"/></svg>`,
  ).toString("base64");

export function hasMedia(path: string) {
  return path in manifest;
}

export function blurFor(src: string | null | undefined) {
  return (src && manifest[src]) || DEFAULT_BLUR;
}

/** Caminho em public/ se o arquivo existir, nas extensões aceitas. */
export function conventionalImage(folder: string, slug: string): string | null {
  for (const ext of ["webp", "jpg", "png"]) {
    const path = `/images/${folder}/${slug}.${ext}`;
    if (hasMedia(path)) return path;
  }
  return null;
}

/** Imagem cadastrada no painel ou, sem ela, a do arquivo por convenção. */
export function resolveImage(dbImage: string | null | undefined, folder: string, slug: string) {
  const src = dbImage || conventionalImage(folder, slug);
  return { src, blur: blurFor(src) };
}

/** Vídeos do hero presentes em public/videos (ver docs/higgsfield-prompts.md). */
export function localHeroVideo() {
  const has = (f: string) => hasMedia(`/videos/${f}`);
  const mp4 = has("hero.mp4") ? "/videos/hero.mp4" : has("hero-mobile.mp4") ? "/videos/hero-mobile.mp4" : null;
  if (!mp4) return null;
  return {
    mp4,
    webm: has("hero.webm") ? "/videos/hero.webm" : undefined,
    mobileMp4: has("hero-mobile.mp4") && mp4 !== "/videos/hero-mobile.mp4" ? "/videos/hero-mobile.mp4" : undefined,
  };
}

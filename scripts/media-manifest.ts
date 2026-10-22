// Manifesto das mídias em public/images e public/videos, gerado no build (next.config.ts).
// Em produção os arquivos de public/ ficam na CDN, fora das funções do servidor:
// o manifesto é a forma de o servidor saber o que existe (e ter o blur de cada foto)
// sem fazer requisições nem gerar 404.
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = "public";
const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm)$/i;

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** { "/images/x.webp": "data:image/webp;base64,…" (blur), "/videos/hero.mp4": "" } */
export async function buildMediaManifest(): Promise<Record<string, string>> {
  const files = [...walk(join(ROOT, "images")), ...walk(join(ROOT, "videos"))];
  // sharp vem com o next; se faltar na plataforma, segue sem blur real
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  const manifest: Record<string, string> = {};
  for (const file of files) {
    const url = "/" + relative(ROOT, file).split(sep).join("/");
    if (VIDEO_EXT.test(file)) manifest[url] = "";
    else if (IMAGE_EXT.test(file)) {
      let blur = "";
      if (sharp) {
        try {
          const buf = await sharp(file).resize(12, 12, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
          blur = `data:image/webp;base64,${buf.toString("base64")}`;
        } catch {
          blur = "";
        }
      }
      manifest[url] = blur;
    }
  }
  return manifest;
}

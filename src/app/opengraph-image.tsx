import { ImageResponse } from "next/og";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Imagem de compartilhamento (WhatsApp, Instagram, Facebook, X), gerada no build.
 * Com public/images/og/og.jpg ela é usada como está; sem ela, compõe a foto do
 * hero (poster ou banner atual) com o logo e o slogan. Ver docs/higgsfield-prompts.md.
 */
export const alt = "Marmifit Camburi — marmitas caseiras feitas todo dia em Camburi, São Sebastião (SP)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const PUBLIC = join(process.cwd(), "public");
const READY = "images/og/og.jpg";
const BACKGROUNDS = ["images/hero/poster.webp", "images/hero/banner.webp", "images/combos/semana.png"];

/** Data URL em PNG/JPEG (o gerador não lê WebP: converte com sharp quando preciso). */
async function asDataUrl(rel: string) {
  const file = join(PUBLIC, rel);
  if (!existsSync(file)) return null;
  if (/\.(png|jpe?g)$/i.test(rel)) {
    const type = rel.endsWith(".png") ? "png" : "jpeg";
    return `data:image/${type};base64,${(await readFile(file)).toString("base64")}`;
  }
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) return null;
  const buf = await sharp(file).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Fontes do site (Fraunces nos títulos, Manrope no texto) do Google Fonts; sem rede, usa a fonte padrão. */
async function googleFont(family: string, weight: number, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** O gerador só produz PNG; com foto, o PNG passa de 1 MB. JPEG fica leve o bastante para a prévia do WhatsApp. */
async function toJpeg(res: ImageResponse) {
  const png = Buffer.from(await res.arrayBuffer());
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) return new Response(png, { headers: { "Content-Type": "image/png" } });
  const jpg = await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } });
}

export default async function Image() {
  const ready = await asDataUrl(READY);
  if (ready) {
    // eslint-disable-next-line @next/next/no-img-element
    return toJpeg(new ImageResponse(<img src={ready} width={1200} height={630} alt="" style={{ objectFit: "cover" }} />, size));
  }

  let bg: string | null = null;
  for (const rel of BACKGROUNDS) {
    bg = await asDataUrl(rel);
    if (bg) break;
  }
  const title = "Comida de verdade, caseira.";
  const subtitle = "Marmitas feitas todo dia em Camburi, São Sebastião · Litoral Norte de SP";
  const [display, sans] = await Promise.all([googleFont("Fraunces", 600, `Marmifit${title}`), googleFont("Manrope", 700, `MARMITAS CAMBURI${subtitle}`)]);
  const fonts = [
    ...(display ? [{ name: "Fraunces", data: display, weight: 600 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Manrope", data: sans, weight: 700 as const, style: "normal" as const }] : []),
  ];

  return toJpeg(new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: "#163B2E", color: "#F8F5ED", fontFamily: sans ? "Manrope" : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bg && <img src={bg} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage: "linear-gradient(90deg, rgba(22,59,46,0.97) 0%, rgba(22,59,46,0.88) 45%, rgba(22,59,46,0.1) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="64" height="64" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="12" fill="#F8F5ED" />
              <path d="M8 21h24a12 12 0 0 1-24 0z" fill="#163B2E" />
              <path d="M20 19c0-6 4-10 10-10 0 6-4 10-10 10z" fill="#43865B" />
              <path d="M20 19c0-4-3-7-7-7 0 4 3 7 7 7z" fill="#F59E42" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, fontFamily: display ? "Fraunces" : undefined, fontWeight: 600, lineHeight: 1 }}>Marmifit</span>
              <span style={{ fontSize: 18, letterSpacing: 4, color: "#F59E42", fontWeight: 700, marginTop: 6 }}>MARMITAS CAMBURI</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <span style={{ fontSize: 76, lineHeight: 1.02, fontFamily: display ? "Fraunces" : undefined, fontWeight: 600 }}>{title}</span>
            <span style={{ fontSize: 28, marginTop: 22, color: "rgba(248,245,237,0.9)", fontWeight: 700 }}>{subtitle}</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  ));
}

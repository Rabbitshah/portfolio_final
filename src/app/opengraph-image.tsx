import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/content";
import { headlineWords } from "@/lib/headline";
import { ogContent } from "@/lib/seo";

export const alt = "Maanav Shah, Full-stack engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The light Understory tokens from globals.css. CSS variables do not exist inside next/og.
const colors = {
  bg: "#F1EEE3",
  ink: "#141A14",
  muted: "#4F5A52",
  accent: "#2F7A4B",
  accentText: "#1F5C4A",
};

// next/og reads ttf, otf and woff (not woff2, which next/font uses), so the fonts come from
// the @fontsource packages. This route has no dynamic input, so Next renders it at build time.
async function loadFont(pkg: string, file: string): Promise<Buffer | null> {
  try {
    return await readFile(
      join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file),
    );
  } catch {
    return null; // fall back to the default font rather than failing the build
  }
}

export default async function Image() {
  const content = ogContent(site);
  const [serif, serifItalic, sans] = await Promise.all([
    loadFont("instrument-serif", "instrument-serif-latin-400-normal.woff"),
    loadFont("instrument-serif", "instrument-serif-latin-400-italic.woff"),
    loadFont("hanken-grotesk", "hanken-grotesk-latin-500-normal.woff"),
  ]);

  const fonts = [
    serif && {
      name: "Instrument Serif",
      data: serif,
      style: "normal" as const,
      weight: 400 as const,
    },
    serifItalic && {
      name: "Instrument Serif",
      data: serifItalic,
      style: "italic" as const,
      weight: 400 as const,
    },
    sans && {
      name: "Hanken Grotesk",
      data: sans,
      style: "normal" as const,
      weight: 500 as const,
    },
  ].filter((font): font is NonNullable<typeof font> => Boolean(font));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: colors.bg,
        color: colors.ink,
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Hanken Grotesk",
          fontWeight: 500,
          fontSize: 36,
          color: colors.muted,
        }}
      >
        {content.name}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          fontFamily: "Instrument Serif",
          fontSize: 104,
          lineHeight: 1.04,
          letterSpacing: -2,
        }}
      >
        {headlineWords(content.headline).map((entry, index) => (
          <span
            key={index}
            style={{
              marginRight: 26,
              fontStyle: entry.emphasized ? "italic" : "normal",
              color: entry.emphasized ? colors.accentText : colors.ink,
            }}
          >
            {entry.word}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Hanken Grotesk",
          fontWeight: 500,
          fontSize: 34,
          color: colors.accent,
        }}
      >
        {content.role}
      </div>
    </div>,
    { ...size, fonts },
  );
}

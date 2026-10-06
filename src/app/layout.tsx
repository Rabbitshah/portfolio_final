import type { Metadata } from "next";
import {
  Hanken_Grotesk,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import { CursorRing } from "@/components/interactive/CursorRing";
import { Footer } from "@/components/sections/Footer";
import { StatusBar } from "@/components/sections/StatusBar";
import { env } from "@/env";
import { site } from "@/lib/content";
import { buildMetadata, resolveSiteUrl } from "@/lib/seo";
import { jsFlagScript } from "@/lib/jsFlag";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = buildMetadata(
  site,
  resolveSiteUrl(env),
  env.SITE_INDEXABLE,
);

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline scripts set data-theme and data-js before React hydrates.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: jsFlagScript }} />
      </head>
      <body>
        <StatusBar />
        {children}
        <Footer />
        <CursorRing />
      </body>
    </html>
  );
}

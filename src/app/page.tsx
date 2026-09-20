import { marquee, site } from "@/lib/content";
import { Marquee } from "@/components/primitives/Marquee";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Highlights } from "@/components/sections/Highlights";
import { Log } from "@/components/sections/Log";
import { Research } from "@/components/sections/Research";
import { Work } from "@/components/sections/Work";
import { personJsonLd, serializeJsonLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(personJsonLd(site)),
        }}
      />
      <main id="top">
        <Hero />
        <Marquee
          label="Technologies I work with"
          items={marquee.map((name) => ({ key: name, content: name }))}
        />
        <About />
        <Work />
        <Research />
        <Highlights />
        <Experience />
        <Log />
        <Faq />
        <Contact />
      </main>
    </>
  );
}

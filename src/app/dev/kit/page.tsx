import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { KitPanel } from "./KitPanel";

// Temporary. Remove at the end of Phase 1b. Keep out of the sitemap in the meantime.
export const metadata: Metadata = {
  title: "Kit",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  return (
    <main className="pb-16 pt-[calc(env(safe-area-inset-top,0px)+112px)]">
      <Container>
        <h1 className="font-serif text-[clamp(2.6rem,7vw,4rem)] leading-none">
          Dev kit
        </h1>
        <p className="mb-10 mt-4 max-w-[60ch] text-muted">
          Temporary page. Each primitive is shown with the light and dark tokens
          forced, whatever the bar toggle says.
        </p>
        <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-2">
          <KitPanel theme="light" />
          <KitPanel theme="dark" />
        </div>
      </Container>
    </main>
  );
}

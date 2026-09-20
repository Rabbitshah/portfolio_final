import { faq } from "@content/faq";
import { Section } from "@/components/primitives/Section";

export function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="06 — FAQ"
      title={
        <>
          Quick <em>answers</em>.
        </>
      }
    >
      <div className="max-w-[860px] border-t border-line">
        {faq.map((item) => (
          <details
            key={item.question}
            name="faq"
            className="border-b border-line"
          >
            <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 py-3.5 transition-colors hover:text-accent-text [&::-webkit-details-marker]:hidden">
              <h3 className="font-serif text-[clamp(1.3rem,2.4vw,1.7rem)] leading-[1.2]">
                {item.question}
              </h3>
              <span className="pm" aria-hidden="true" />
            </summary>
            <p className="max-w-[66ch] pb-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

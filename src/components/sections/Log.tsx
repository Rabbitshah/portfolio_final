import { log } from "@/lib/content";
import { Section } from "@/components/primitives/Section";
import { formatDate } from "@/lib/format";

export function Log() {
  return (
    <Section
      id="log"
      eyebrow="05 — Log"
      title={
        <>
          The <em>build log</em>.
        </>
      }
    >
      <ul>
        {log.map((entry) => (
          <li
            key={entry.date + entry.text}
            className="grid grid-cols-[minmax(0,1fr)] gap-1 border-t border-line py-4 last:border-b min-[560px]:grid-cols-[110px_minmax(0,1fr)] min-[560px]:gap-4"
          >
            <time
              dateTime={entry.date}
              className="pt-[3px] font-mono text-[.78rem] text-muted"
            >
              {formatDate(entry.date)}
            </time>
            <span>{entry.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

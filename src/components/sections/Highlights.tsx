import {
  experience,
  derivedHighlightLabels,
  otherHighlights,
  papers,
  visibleProjects,
} from "@/lib/content";
import { Marquee } from "@/components/primitives/Marquee";
import { deriveStats } from "@/lib/stats";

const stats = deriveStats({ experience, projects: visibleProjects, papers });

// The first three counts are derived from content; the rest come from content/highlights.ts.
const items = [
  { value: String(stats.papers), label: derivedHighlightLabels.papers },
  { value: String(stats.roles), label: derivedHighlightLabels.roles },
  { value: String(stats.projects), label: derivedHighlightLabels.projects },
  ...otherHighlights,
];

export function Highlights() {
  return (
    <Marquee
      label="Highlights"
      variant="receipts"
      items={items.map((item) => ({
        key: item.label,
        content: (
          <>
            <b className="block font-serif text-[1.7rem] font-normal leading-[1.05] text-accent-text">
              {item.value}
            </b>
            {item.label}
          </>
        ),
      }))}
    />
  );
}

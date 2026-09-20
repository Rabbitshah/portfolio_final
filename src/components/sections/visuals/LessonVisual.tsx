import { cx } from "@/lib/cx";

// Decorative sample UI, copied from reference/portfolio-template.html.
const lessons: [string, boolean][] = [
  ["1. Introduction", true],
  ["2. Core ideas", true],
  ["3. Practice", false],
  ["4. Project", false],
];

export function LessonVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {lessons.map(([label, done]) => (
        <div
          key={label}
          className={cx(
            "flex items-center gap-2.5 text-[.85rem]",
            done ? "text-ink" : "text-muted",
          )}
        >
          <i
            className={cx(
              "size-4 shrink-0 rounded-full border-[1.5px]",
              done ? "border-transparent bg-accent" : "border-line-strong",
            )}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

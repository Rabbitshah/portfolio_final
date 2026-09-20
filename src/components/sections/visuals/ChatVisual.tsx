import { cx } from "@/lib/cx";

// Decorative sample chat, copied from reference/portfolio-template.html.
const messages: ["a" | "u", string][] = [
  ["a", "How are you feeling today?"],
  ["u", "A bit stressed about exams."],
  ["a", "That's understandable. Want to talk it through?"],
];

export function ChatVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 text-[.82rem]">
      {messages.map(([from, text]) => (
        <div
          key={text}
          className={cx(
            "max-w-[76%] rounded-[14px] px-[13px] py-[9px] leading-[1.35]",
            from === "a"
              ? "rounded-bl-[4px] border border-line bg-card"
              : "self-end rounded-br-[4px] bg-accent text-accent-ink",
          )}
        >
          {text}
        </div>
      ))}
    </div>
  );
}

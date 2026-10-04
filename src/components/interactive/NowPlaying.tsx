// The template's "now playing" chip, 1320 px and up. Decorative (aria-hidden).
// One fixed fact. The three bars play three times and come to rest (see .eq-bar in globals.css),
// so nothing moves or updates for more than 5 s (WCAG 2.2.2). Pure CSS: no client JavaScript.
// Rest heights are spacing tokens, 4 / 12 / 8 px (h-1, h-3, h-2): three different heights, so at
// rest the bars read as an equalizer icon and not as an ellipsis. --eq-peak is where each one moves to.
// max-w and the ellipsis are only a last resort: shorten the fact in content/site.ts instead.
export function NowPlaying({ fact }: { fact: string }) {
  return (
    <div
      aria-hidden="true"
      className="hidden min-h-7 w-max max-w-[22rem] items-center gap-2.5 overflow-hidden border-x border-line px-3.5 font-mono text-[.72rem] text-muted min-[1320px]:flex"
    >
      <span className="flex h-3 shrink-0 items-end gap-0.5">
        <i className="eq-bar h-1 [--eq-peak:calc(var(--spacing)*3)]" />
        <i className="eq-bar h-3 [--eq-peak:calc(var(--spacing)*1)] [animation-delay:.2s]" />
        <i className="eq-bar h-2 [--eq-peak:calc(var(--spacing)*3)] [animation-delay:.4s]" />
      </span>
      <span className="truncate">{fact}</span>
    </div>
  );
}

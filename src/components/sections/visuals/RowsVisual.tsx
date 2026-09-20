// Decorative sample data, copied from reference/portfolio-template.html.
const rows: [string, number][] = [
  ["Quant", 82],
  ["Verbal", 55],
  ["Vocab", 68],
  ["Backlog", 30],
];

export function RowsVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3.5">
      {rows.map(([label, percent]) => (
        <div
          key={label}
          className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-3 font-mono text-[.72rem] text-muted"
        >
          {label}
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

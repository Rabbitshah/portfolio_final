// Decorative sample data, copied from reference/portfolio-template.html.
const heights = [38, 52, 44, 66, 58, 72, 49, 34, 41, 29];

export function BarsVisual() {
  return (
    <div className="flex h-full items-end gap-[9px] pb-4">
      {heights.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-[5px] bg-accent ring-1 ring-inset ring-line-strong"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

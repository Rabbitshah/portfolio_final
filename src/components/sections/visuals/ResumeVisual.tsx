// Decorative sample layout, copied from reference/portfolio-template.html.
const widths = [70, 88, 62, 80, 54];

export function ResumeVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-[9px]">
      <i className="block h-3.5 w-[44%] rounded-full bg-accent" />
      {widths.map((width, index) => (
        <i
          key={index}
          className="block h-[9px] rounded-full bg-line-strong"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

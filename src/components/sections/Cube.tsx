// Decorative and static. Face labels are copied from reference/portfolio-template.html.
const faces = ["React", "Django", "FastAPI", "Celery", "Redis", "NEAT"];

export function Cube() {
  return (
    <div className="stage" aria-hidden="true">
      <div className="cube">
        {faces.map((label, index) => (
          <div key={label} className={`face f${index + 1}`}>
            {label}
          </div>
        ))}
        <div className="core">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

// The label of a rolling-text link. A Server Component, no JavaScript.
//
// The label is in the DOM exactly once. The copy that slides in is a CSS pseudo-element whose text
// comes from data-label, with empty alternative text (`content: attr(data-label) / ""`), so it is
// not in the DOM, the accessibility tree, copy and paste or find-in-page. The roll itself is in
// globals.css (.roll); outside its gate (touch, reduced motion, forced colors, no JavaScript, or a
// browser without alt text on generated content) these two spans are unstyled and the link is
// exactly what it was. Put the class `roll-host` on the link or button that holds it.
export function RollText({ children }: { children: string }) {
  return (
    <span className="roll" data-label={children}>
      <span className="roll-text">{children}</span>
    </span>
  );
}

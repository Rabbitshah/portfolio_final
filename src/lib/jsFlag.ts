// Runs in <head> before first paint. It marks the page as "JavaScript is running", and CSS only
// starts the marquee animation under that mark (see .marquee in globals.css). The pause button is
// rendered by React, so without this gate a visitor with JavaScript off would get moving text
// and no way to stop it (WCAG 2.2.2).
// TODO(phase-7): like themeInitScript, this inline script needs a nonce or hash once the CSP is added (PLAN §12).
export const jsFlagScript = `document.documentElement.dataset.js="1"`;

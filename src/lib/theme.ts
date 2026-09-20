export const THEME_STORAGE_KEY = "theme";

// Runs in <head> before first paint so a saved choice never flashes the wrong theme.
// With no saved choice, CSS follows the system preference.
// TODO(phase-7): this inline script needs a nonce or hash once the CSP is added (PLAN §12).
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

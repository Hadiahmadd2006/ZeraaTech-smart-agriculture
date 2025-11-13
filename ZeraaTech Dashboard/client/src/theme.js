export function applyTheme(theme) {
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove("theme-light", "theme-dark");
  body.classList.remove("theme-light", "theme-dark");

  const className = theme === "Dark" ? "theme-dark" : "theme-light";
  root.classList.add(className);
  body.classList.add(className);
}

export function applyThemeFromStorage() {
  try {
    const stored = localStorage.getItem("theme") || "Light";
    applyTheme(stored);
  } catch {
    // ignore if localStorage is not available
  }
}

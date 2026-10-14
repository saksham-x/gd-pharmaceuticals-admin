import { useSyncExternalStore } from "react";

// ========================================
// THEME
//
// Light or dark, remembered per browser.
// A first visit follows the system
// setting. The choice lives on <html> as
// the `dark` class, which index.css reads.
// ========================================

export type Theme = "light" | "dark";

const STORAGE_KEY = "adminTheme";

const listeners = new Set<() => void>();

function readStored(): Theme | null {
  try {
    const value =
      localStorage.getItem(STORAGE_KEY);

    return value === "light" ||
      value === "dark"
      ? value
      : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

let current: Theme =
  readStored() ?? systemTheme();

function apply(theme: Theme) {
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark"
  );
}

// Called once from main.tsx before the
// first render, so there is no flash of
// the wrong theme.
export function initTheme() {
  apply(current);
}

export function setTheme(theme: Theme) {
  current = theme;

  apply(theme);

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode: the choice lasts for
    // this visit only.
  }

  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(
    current === "dark" ? "light" : "dark"
  );
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    () => current
  );
}

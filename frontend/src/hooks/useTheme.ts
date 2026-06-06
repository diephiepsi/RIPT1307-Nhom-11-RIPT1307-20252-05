import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'unibrain:theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  // Locked to light: ignore localStorage and system prefs.
  const mode: ThemeMode = 'light';
  const setTheme = (_: ThemeMode) => {};
  const toggle = () => {};
  const active: 'light' | 'dark' = 'light';
  try { document.documentElement.removeAttribute('data-theme'); } catch {}
  return { mode, setTheme, toggle, active } as const;
}

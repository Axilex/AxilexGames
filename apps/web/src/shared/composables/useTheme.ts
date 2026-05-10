import { ref } from 'vue';

const STORAGE_KEY = 'theme';

function readPreferred(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    /* localStorage unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
}

const isDark = ref(
  typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
);

export function useTheme() {
  function toggle(): void {
    isDark.value = !isDark.value;
    apply(isDark.value);
    try {
      localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }

  function sync(): void {
    isDark.value = readPreferred();
    apply(isDark.value);
  }

  return { isDark, toggle, sync };
}

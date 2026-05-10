/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--c-surface-muted) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        'border-strong': 'rgb(var(--c-border-strong) / <alpha-value>)',
        foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--c-foreground-muted) / <alpha-value>)',
        'foreground-subtle': 'rgb(var(--c-foreground-subtle) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

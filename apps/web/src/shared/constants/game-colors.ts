export interface GameColorScheme {
  /** Tailwind gradient classes for the card banner */
  gradient: string;
  /** Card wrapper hover border + shadow classes */
  cardHover: string;
  /** "Jouer" CTA text + arrow color */
  cta: string;
  /** Generic tag pill background + text */
  tag: string;
  /** Lobby button classes when selected */
  lobbySelected: string;
  /** Lobby button hover border */
  lobbyHover: string;
}

// All five schemes share the same structure: a base hue applied through
// `*-50` (light tints) for backgrounds, `*-300/400` for borders and rings,
// and `*-600/700` for text/CTAs. In dark mode the same hue is reused at
// `*-950/40` for backgrounds and `*-300` for text so contrast stays right.
export const GAME_COLOR_SCHEMES = {
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    cardHover:
      'hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/60 dark:hover:shadow-none dark:hover:border-amber-700',
    cta: 'text-amber-600 dark:text-amber-300 group-hover:text-amber-700 dark:group-hover:text-amber-200',
    tag: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
    lobbySelected:
      'border-amber-400 bg-amber-50 ring-2 ring-amber-300 dark:bg-amber-950/40 dark:border-amber-600 dark:ring-amber-700',
    lobbyHover: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    cardHover:
      'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60 dark:hover:shadow-none dark:hover:border-blue-700',
    cta: 'text-blue-600 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200',
    tag: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300',
    lobbySelected:
      'border-blue-400 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40 dark:border-blue-600 dark:ring-blue-700',
    lobbyHover: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  violet: {
    gradient: 'from-violet-500 to-pink-500',
    cardHover:
      'hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/60 dark:hover:shadow-none dark:hover:border-violet-700',
    cta: 'text-violet-600 dark:text-violet-300 group-hover:text-violet-700 dark:group-hover:text-violet-200',
    tag: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300',
    lobbySelected:
      'border-violet-400 bg-violet-50 ring-2 ring-violet-300 dark:bg-violet-950/40 dark:border-violet-600 dark:ring-violet-700',
    lobbyHover: 'hover:border-violet-300 dark:hover:border-violet-700',
  },
  teal: {
    gradient: 'from-teal-500 to-cyan-500',
    cardHover:
      'hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/60 dark:hover:shadow-none dark:hover:border-teal-700',
    cta: 'text-teal-600 dark:text-teal-300 group-hover:text-teal-700 dark:group-hover:text-teal-200',
    tag: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300',
    lobbySelected:
      'border-teal-400 bg-teal-50 ring-2 ring-teal-300 dark:bg-teal-950/40 dark:border-teal-600 dark:ring-teal-700',
    lobbyHover: 'hover:border-teal-300 dark:hover:border-teal-700',
  },
  emerald: {
    gradient: 'from-emerald-500 to-cyan-500',
    cardHover:
      'hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/60 dark:hover:shadow-none dark:hover:border-emerald-700',
    cta: 'text-emerald-600 dark:text-emerald-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-200',
    tag: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300',
    lobbySelected:
      'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-600 dark:ring-emerald-700',
    lobbyHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
} satisfies Record<string, GameColorScheme>;

export type GameColorKey = keyof typeof GAME_COLOR_SCHEMES;

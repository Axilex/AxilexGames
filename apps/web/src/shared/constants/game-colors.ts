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

export const GAME_COLOR_SCHEMES = {
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    cardHover: 'hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/60',
    cta: 'text-amber-600 group-hover:text-amber-700',
    tag: 'bg-amber-50 text-amber-600',
    lobbySelected: 'border-amber-400 bg-amber-50 ring-2 ring-amber-300',
    lobbyHover: 'hover:border-amber-300',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    cardHover: 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60',
    cta: 'text-blue-600 group-hover:text-blue-700',
    tag: 'bg-blue-50 text-blue-600',
    lobbySelected: 'border-blue-400 bg-blue-50 ring-2 ring-blue-300',
    lobbyHover: 'hover:border-blue-300',
  },
  violet: {
    gradient: 'from-violet-500 to-pink-500',
    cardHover: 'hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/60',
    cta: 'text-violet-600 group-hover:text-violet-700',
    tag: 'bg-violet-50 text-violet-600',
    lobbySelected: 'border-violet-400 bg-violet-50 ring-2 ring-violet-300',
    lobbyHover: 'hover:border-violet-300',
  },
  teal: {
    gradient: 'from-teal-500 to-cyan-500',
    cardHover: 'hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/60',
    cta: 'text-teal-600 group-hover:text-teal-700',
    tag: 'bg-teal-50 text-teal-600',
    lobbySelected: 'border-teal-400 bg-teal-50 ring-2 ring-teal-300',
    lobbyHover: 'hover:border-teal-300',
  },
} satisfies Record<string, GameColorScheme>;

export type GameColorKey = keyof typeof GAME_COLOR_SCHEMES;

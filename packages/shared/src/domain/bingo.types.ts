export type BingoConstraintId =
  | 'year_in_title'
  | 'biographical'
  | 'country'
  | 'has_main_image'
  | 'artist'
  | 'sportsperson'
  | 'city'
  | 'many_images'
  | 'film_or_series'
  | 'science';

export interface BingoConstraintMeta {
  id: BingoConstraintId;
  label: string;
}

export const BINGO_CONSTRAINTS: BingoConstraintMeta[] = [
  { id: 'year_in_title', label: 'Année dans le titre' },
  { id: 'biographical', label: 'Page biographique' },
  { id: 'country', label: "Page d'un pays" },
  { id: 'has_main_image', label: 'Page avec une image principale' },
  { id: 'artist', label: "Page d'un artiste" },
  { id: 'sportsperson', label: "Page d'un sportif" },
  { id: 'city', label: "Page d'une ville" },
  { id: 'many_images', label: '5+ images' },
  { id: 'film_or_series', label: 'Film ou série' },
  { id: 'science', label: 'Article scientifique' },
];

export interface BingoCardEntry {
  constraintId: BingoConstraintId;
  validated: boolean;
  validatedOnSlug: string | null;
}

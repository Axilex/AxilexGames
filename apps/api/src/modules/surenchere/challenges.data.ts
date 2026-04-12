import { randomUUID } from 'crypto';
import { SurenchereChallenge } from '@wiki-race/shared';

export const CHALLENGES: Omit<SurenchereChallenge, 'id' | 'letter' | 'source'>[] = [
  { category: '⚽ Football', prompt: 'citer des joueurs de foot avec la lettre' },
  { category: '🎾 Tennis', prompt: 'citer des joueurs de tennis avec la lettre' },
  { category: '🏀 Basketball', prompt: 'citer des joueurs de basket avec la lettre' },
  { category: '🏎️ F1', prompt: 'citer des pilotes de F1 avec la lettre' },
  { category: '🌍 Pays', prompt: 'citer des pays avec la lettre' },
  { category: '🌆 Capitales', prompt: 'citer des capitales avec la lettre' },
  { category: '🍎 Fruits', prompt: 'citer des fruits avec la lettre' },
  { category: '🥦 Légumes', prompt: 'citer des légumes avec la lettre' },
  { category: '🦁 Animaux', prompt: 'citer des animaux sauvages avec la lettre' },
  { category: '🌸 Fleurs', prompt: 'citer des fleurs avec la lettre' },
  { category: '🎬 Films', prompt: 'citer des films célèbres avec la lettre' },
  { category: '📚 Auteurs', prompt: 'citer des auteurs de romans avec la lettre' },
  { category: '🎵 Chanteurs', prompt: 'citer des chanteurs/chanteuses avec la lettre' },
  { category: '🎭 Acteurs', prompt: 'citer des acteurs/actrices avec la lettre' },
  { category: '🚗 Voitures', prompt: 'citer des marques de voiture avec la lettre' },
  { category: '💻 Marques tech', prompt: 'citer des marques de technologie avec la lettre' },
  { category: '🍕 Plats', prompt: 'citer des plats du monde avec la lettre' },
  { category: '🌐 Langues', prompt: 'citer des langues parlées dans le monde avec la lettre' },
  { category: '🏔️ Montagnes', prompt: 'citer des chaînes de montagnes avec la lettre' },
  { category: '🌊 Fleuves', prompt: 'citer des fleuves avec la lettre' },
  { category: '🎮 Jeux vidéo', prompt: 'citer des jeux vidéo avec la lettre' },
  { category: '📺 Séries TV', prompt: 'citer des séries télévisées avec la lettre' },
  {
    category: '⚔️ Personnages historiques',
    prompt: 'citer des personnages historiques avec la lettre',
  },
  { category: '🎸 Groupes de musique', prompt: 'citer des groupes de musique avec la lettre' },
  { category: '🧪 Sciences', prompt: 'citer des termes scientifiques avec la lettre' },
  { category: '🏛️ Villes françaises', prompt: 'citer des villes françaises avec la lettre' },
  { category: '🎤 Rappeurs', prompt: 'citer des rappeurs/rappeuses avec la lettre' },
];

export const LETTERS = 'ABCDEFGHIJLMNOPRSTV'.split('');

export function pickRandomChallenge(): SurenchereChallenge {
  const base = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { ...base, id: randomUUID(), letter, source: 'predefined' };
}

export function pickRandomChallenges(n: number): SurenchereChallenge[] {
  const picks: SurenchereChallenge[] = [];
  const usedCats = new Set<string>();
  while (picks.length < n && usedCats.size < CHALLENGES.length) {
    const c = pickRandomChallenge();
    if (usedCats.has(c.category)) continue;
    usedCats.add(c.category);
    picks.push(c);
  }
  return picks;
}

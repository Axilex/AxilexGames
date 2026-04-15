import { randomUUID } from 'crypto';
import { SurenchereChallenge } from '@wiki-race/shared';

export const CHALLENGES: Omit<SurenchereChallenge, 'id' | 'source'>[] = [
  { category: '⚽ Football', prompt: 'citer des joueurs de foot' },
  { category: '🎾 Tennis', prompt: 'citer des joueurs de tennis' },
  { category: '🏀 Basketball', prompt: 'citer des joueurs de basket' },
  { category: '🏎️ F1', prompt: 'citer des pilotes de F1' },
  { category: '🌍 Pays', prompt: 'citer des pays du monde' },
  { category: '🌆 Capitales', prompt: 'citer des capitales mondiales' },
  { category: '🍎 Fruits', prompt: 'citer des fruits' },
  { category: '🥦 Légumes', prompt: 'citer des légumes' },
  { category: '🦁 Animaux', prompt: 'citer des animaux sauvages' },
  { category: '🌸 Fleurs', prompt: 'citer des fleurs' },
  { category: '🎬 Films', prompt: 'citer des films célèbres' },
  { category: '📚 Auteurs', prompt: 'citer des auteurs de romans' },
  { category: '🎵 Chanteurs', prompt: 'citer des chanteurs ou chanteuses' },
  { category: '🎭 Acteurs', prompt: 'citer des acteurs ou actrices' },
  { category: '🚗 Voitures', prompt: 'citer des marques de voiture' },
  { category: '💻 Marques tech', prompt: 'citer des marques de technologie' },
  { category: '🍕 Plats', prompt: 'citer des plats du monde' },
  { category: '🌐 Langues', prompt: 'citer des langues parlées dans le monde' },
  { category: '🏔️ Montagnes', prompt: 'citer des chaînes de montagnes' },
  { category: '🌊 Fleuves', prompt: 'citer des fleuves' },
  { category: '🎮 Jeux vidéo', prompt: 'citer des jeux vidéo' },
  { category: '📺 Séries TV', prompt: 'citer des séries télévisées' },
  { category: '⚔️ Personnages historiques', prompt: 'citer des personnages historiques célèbres' },
  { category: '🎸 Groupes de musique', prompt: 'citer des groupes de musique' },
  { category: '🧪 Sciences', prompt: 'citer des termes scientifiques' },
  { category: '🏛️ Villes françaises', prompt: 'citer des villes françaises' },
  { category: '🎤 Rappeurs', prompt: 'citer des rappeurs ou rappeuses' },
  {
    category: '🍷 Gastronomie',
    prompt: 'citer des plats ou spécialités gastronomiques françaises',
  },
  { category: '🗺️ Géographie', prompt: 'citer des régions, départements ou villes de France' },
  { category: '📖 Littérature', prompt: 'citer des romans ou auteurs de la littérature classique' },
  {
    category: '🔬 Inventions',
    prompt: 'citer des inventions ou découvertes scientifiques célèbres',
  },
  { category: '🏛️ Histoire', prompt: 'citer des événements historiques majeurs' },
  {
    category: '🎤 Musique française',
    prompt: 'citer des artistes ou groupes de musique française',
  },
  { category: '🎭 Théâtre', prompt: 'citer des pièces de théâtre ou dramaturges célèbres' },
];

export function pickRandomChallenge(): SurenchereChallenge {
  const base = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  return { ...base, id: randomUUID(), source: 'predefined' };
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

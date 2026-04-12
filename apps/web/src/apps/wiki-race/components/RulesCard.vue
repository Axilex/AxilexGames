<template>
  <SharedRulesCard :sections="sections" />
</template>

<script setup lang="ts">
import { BINGO_CONSTRAINTS } from '@wiki-race/shared';
import SharedRulesCard, { type RuleSection } from '@/shared/components/ui/RulesCard.vue';

const CONSTRAINT_ICONS: Record<string, string> = {
  year_in_title: '📅',
  biographical: '👤',
  country: '🌍',
  has_main_image: '🖼',
  artist: '🎨',
  sportsperson: '⚽',
  city: '🏙',
  many_images: '📸',
  film_or_series: '🎬',
  science: '🔬',
};

const CONSTRAINT_DESCRIPTIONS: Record<string, string> = {
  year_in_title: 'Titre avec une année (ex: Guerre de 1812).',
  biographical: 'Page sur une personne (infobox Naissance).',
  country: 'Pays ou état (infobox Capitale/Gentilé).',
  has_main_image: "Image principale dans l'infobox.",
  artist: 'Artiste (infobox Activité: musicien, acteur…).',
  sportsperson: 'Sportif (infobox Sport).',
  city: 'Commune ou ville (classe infobox commune).',
  many_images: '5+ images réelles dans la page.',
  film_or_series: 'Film ou série (infobox Réalisation/Chaîne).',
  science: "Discipline scientifique mentionnée dans l'intro.",
};

const sections: RuleSection[] = [
  {
    title: 'Modes',
    items: [
      { icon: '🏁', label: 'Classique', description: 'Premier à la cible gagne.' },
      { icon: '🎯', label: 'Bingo Wiki', description: 'Validez toutes les contraintes.' },
    ],
  },
  {
    title: 'Contraintes Bingo',
    items: BINGO_CONSTRAINTS.map((c) => ({
      icon: CONSTRAINT_ICONS[c.id] ?? '•',
      label: c.label,
      description: CONSTRAINT_DESCRIPTIONS[c.id] ?? '',
    })),
  },
  {
    title: 'Général',
    bullets: [
      'Seuls les liens dans le texte comptent.',
      'Les notes [1] ne sont pas cliquables.',
      'Ctrl+F désactivé en jeu.',
      'Abandonner vous marque comme éliminé.',
      "Seul l'hôte peut relancer une partie.",
    ],
  },
];
</script>

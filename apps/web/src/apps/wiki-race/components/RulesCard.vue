<template>
  <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
    <div class="px-4 py-2.5 border-b border-stone-100 flex items-center gap-2">
      <span class="text-sm">📖</span>
      <span class="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Règles</span>
    </div>

    <div class="px-4 py-3 flex flex-col gap-3">
      <!-- Modes -->
      <div class="flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Modes</p>
        <div
          v-for="m in modes"
          :key="m.value"
          class="flex gap-1.5 items-start"
        >
          <span class="shrink-0 text-xs leading-tight mt-px">{{ m.icon }}</span>
          <div class="text-[10px] leading-tight">
            <span class="font-semibold text-stone-700">{{ m.label }}</span>
            <span class="text-stone-400"> — {{ m.description }}</span>
          </div>
        </div>
      </div>

      <!-- Bingo constraints -->
      <div class="flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
          Contraintes Bingo
        </p>
        <div
          v-for="c in constraints"
          :key="c.id"
          class="flex gap-1.5 items-start"
        >
          <span class="shrink-0 text-xs leading-tight mt-px">{{ c.icon }}</span>
          <div class="text-[10px] leading-tight">
            <span class="font-semibold text-stone-700">{{ c.label }}</span>
            <span class="text-stone-400"> — {{ c.description }}</span>
          </div>
        </div>
      </div>

      <!-- General rules -->
      <div class="flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Général</p>
        <ul class="text-[10px] text-stone-500 flex flex-col gap-0.5 list-disc list-inside">
          <li>Seuls les liens dans le texte comptent.</li>
          <li>Les notes [1] ne sont pas cliquables.</li>
          <li>Ctrl+F désactivé en jeu.</li>
          <li>Abandonner vous marque comme éliminé.</li>
          <li>Seul l'hôte peut relancer une partie.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameMode, BINGO_CONSTRAINTS } from '@wiki-race/shared';

const modes = [
  {
    value: GameMode.CLASSIC,
    icon: '🏁',
    label: 'Classique',
    description: 'Premier à la cible gagne.',
  },
  {
    value: GameMode.SPRINT,
    icon: '⚡',
    label: 'Sprint',
    description: "Même but, timer obligatoire.",
  },
  {
    value: GameMode.LABYRINTH,
    icon: '🧩',
    label: 'Labyrinthe',
    description: 'Clics limités — plus de clics = éliminé.',
  },
  {
    value: GameMode.DRIFT,
    icon: '🌊',
    label: 'WikiDrift',
    description: 'Optimisez un score selon l\'objectif.',
  },
  {
    value: GameMode.BINGO,
    icon: '🎯',
    label: 'Bingo Wiki',
    description: 'Validez toutes les contraintes.',
  },
];

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
  has_main_image: 'Image principale dans l\'infobox.',
  artist: 'Artiste (infobox Activité: musicien, acteur…).',
  sportsperson: 'Sportif (infobox Sport).',
  city: 'Commune ou ville (classe infobox commune).',
  many_images: '10+ images réelles dans la page.',
  film_or_series: 'Film ou série (infobox Réalisation/Chaîne).',
  science: 'Discipline scientifique mentionnée dans l\'intro.',
};

const constraints = BINGO_CONSTRAINTS.map((c) => ({
  id: c.id,
  label: c.label,
  icon: CONSTRAINT_ICONS[c.id] ?? '•',
  description: CONSTRAINT_DESCRIPTIONS[c.id] ?? '',
}));
</script>

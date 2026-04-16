<template>
  <SharedRulesCard :sections="sections" />
</template>

<script setup lang="ts">
import SharedRulesCard, { type RuleSection } from '@/shared/components/ui/RulesCard.vue';

const sections: RuleSection[] = [
  {
    title: 'Deroulement',
    items: [
      { icon: '🔤', label: 'Mot de depart', description: 'Chaque joueur recoit un mot different.' },
      {
        icon: '🧠',
        label: 'Convergence',
        description: 'Soumettez simultanement un mot pour vous rapprocher des autres.',
      },
      {
        icon: '✨',
        label: 'Match',
        description: 'Si 2+ joueurs soumettent le meme mot, ils marquent des points.',
      },
      {
        icon: '🔄',
        label: 'Round suivant',
        description: 'Votre dernier mot devient votre nouveau point de depart.',
      },
    ],
  },
  {
    title: 'Scoring',
    items: [
      {
        icon: '🎯',
        label: 'Match',
        description: "Points si votre mot correspond a celui d'un autre joueur.",
      },
      { icon: '😶', label: 'Seul', description: 'Aucun point si personne ne partage votre mot.' },
      {
        icon: '🏁',
        label: 'Fin',
        description: 'Le joueur avec le plus de points gagne apres N rounds.',
      },
    ],
  },
  {
    title: 'General',
    bullets: [
      "Seul l'hote peut lancer la partie et passer au round suivant.",
      'Les mots sont normalises (casse et accents ignores).',
      "Un timer par round — soumettez avant qu'il expire !",
    ],
  },
];
</script>

<template>
  <SharedRulesCard :sections="sections" />
</template>

<script setup lang="ts">
import SharedRulesCard, { type RuleSection } from '@/shared/components/ui/RulesCard.vue';

const sections: RuleSection[] = [
  {
    title: 'Deroulement',
    items: [
      { icon: '📸', label: 'Photo', description: "Une image s'affiche 3 secondes puis disparait." },
      { icon: '✍️', label: 'Mot', description: 'Chacun ecrit UN mot pour la decrire. Timer 10 s.' },
      { icon: '🃏', label: 'Revelation', description: 'Tous les mots sont reveles simultanement.' },
      { icon: '🏆', label: 'Points', description: 'Points selon la rarete de ton groupe.' },
    ],
  },
  {
    title: 'Scoring',
    items: [
      { icon: '🎯', label: 'Duo parfait', description: 'Groupe de 2 → 10 pts chacun.' },
      { icon: '👥', label: 'Groupe de 3-5', description: 'round(10 / (taille - 1)) pts.' },
      { icon: '🐑', label: 'Tout le monde pareil', description: '1 pt (trop evident !).' },
      { icon: '😶', label: 'Seul', description: '0 pt (incompris...).' },
    ],
  },
  {
    title: 'General',
    bullets: [
      "Seul l'hote peut lancer la partie.",
      'La partie se termine apres N manches.',
      'Les mots sont normalises (casse, accents ignores).',
    ],
  },
];
</script>

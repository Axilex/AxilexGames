<template>
  <SharedRulesCard :sections="sections" />
</template>

<script setup lang="ts">
import SharedRulesCard, { type RuleSection } from '@/shared/components/ui/RulesCard.vue';

const sections: RuleSection[] = [
  {
    title: 'Déroulement',
    items: [
      { icon: '🎯', label: 'Défi', description: 'Le meneur choisit un défi parmi 3 propositions.' },
      {
        icon: '💰',
        label: 'Enchères',
        description: 'Les joueurs surenchérissent ou passent. Timer de 30 s.',
      },
      { icon: '📝', label: 'Mots', description: 'Le gagnant liste ses mots. Timer configurable.' },
      {
        icon: '🗳',
        label: 'Vote bloc',
        description: 'Tous les autres votent ✅ Accepter ou ❌ Refuser.',
      },
    ],
  },
  {
    title: 'Score',
    items: [
      { icon: '✅', label: 'Succès complet', description: '+enchère (+ 1 point si forcé).' },
      { icon: '⚠️', label: 'Échec partiel', description: '-1 par mot manquant.' },
      { icon: '❌', label: 'Échec total (aucun mot)', description: 'Aucun point perdu.' },
    ],
  },
  {
    title: 'Général',
    bullets: [
      'Le meneur tourne à chaque manche.',
      "Seul l'hôte peut lancer la partie.",
      "En cas d'égalité des votes, les mots sont refusés.",
      'Si tous passent, le dernier à passer est forcé au bid de départ.',
      'La partie se termine après N manches.',
    ],
  },
];
</script>

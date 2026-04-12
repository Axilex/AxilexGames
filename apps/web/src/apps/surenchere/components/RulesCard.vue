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
      { icon: '💰', label: 'Enchères', description: 'Les joueurs surenchérissent ou passent.' },
      { icon: '📝', label: 'Mots', description: 'Le gagnant des enchères liste ses mots.' },
      { icon: '🗳', label: 'Vote', description: 'Tous valident chaque mot (majorité stricte).' },
    ],
  },
  {
    title: 'Score',
    items: [
      { icon: '✅', label: 'Succès', description: '+enchère (+ passeurs si forcé).' },
      { icon: '❌', label: 'Échec', description: '-enchère.' },
      { icon: '🔥', label: 'Forcé', description: 'Si tous passent, le meneur joue avec bonus.' },
    ],
  },
  {
    title: 'Général',
    bullets: [
      'Le meneur tourne à chaque manche.',
      "Seul l'hôte peut lancer la partie.",
      'Un mot en égalité de votes est rejeté.',
      'La partie se termine après N manches.',
    ],
  },
];
</script>

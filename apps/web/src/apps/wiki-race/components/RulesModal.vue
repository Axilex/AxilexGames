<template>
  <Teleport to="body">
    <Transition name="rules-fade">
      <div
        v-if="showRules"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeRules"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40"
          @click="closeRules"
        />

        <!-- Panel -->
        <div
          class="relative z-10 w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
        >
          <!-- Header -->
          <div
            class="shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-200"
          >
            <div class="flex items-center gap-2">
              <span class="text-xl">📖</span>
              <h2 class="text-base font-bold text-stone-900">
                Règles du jeu
              </h2>
            </div>
            <button
              type="button"
              class="text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none"
              aria-label="Fermer"
              @click="closeRules"
            >
              ✕
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-7">
            <!-- Modes -->
            <section class="flex flex-col gap-3">
              <h3
                class="text-xs font-semibold text-stone-500 uppercase tracking-widest"
              >
                Modes de jeu
              </h3>
              <div
                v-for="m in modes"
                :key="m.value"
                class="flex gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50"
              >
                <span class="text-2xl leading-none mt-0.5 shrink-0">{{ m.icon }}</span>
                <div class="flex flex-col gap-0.5">
                  <div class="text-sm font-semibold text-stone-900">
                    {{ m.label }}
                  </div>
                  <div class="text-xs text-stone-500">
                    {{ m.description }}
                  </div>
                </div>
              </div>
            </section>

            <!-- Bingo constraints -->
            <section class="flex flex-col gap-3">
              <h3
                class="text-xs font-semibold text-stone-500 uppercase tracking-widest"
              >
                Contraintes Bingo
              </h3>
              <p class="text-xs text-stone-400">
                Le serveur analyse le contenu et l'infobox de chaque page pour valider les
                contraintes. Une contrainte n'est validée qu'une seule fois par partie.
              </p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="c in constraintDetails"
                  :key="c.id"
                  class="flex gap-3 items-start p-3 rounded-xl border border-stone-100"
                >
                  <span class="text-base shrink-0">{{ c.icon }}</span>
                  <div>
                    <div class="text-xs font-semibold text-stone-800">
                      {{ c.label }}
                    </div>
                    <div class="text-xs text-stone-400 mt-0.5">
                      {{ c.description }}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- General rules -->
            <section class="flex flex-col gap-2">
              <h3
                class="text-xs font-semibold text-stone-500 uppercase tracking-widest"
              >
                Règles générales
              </h3>
              <ul class="text-xs text-stone-500 flex flex-col gap-1 list-disc list-inside">
                <li>Seuls les liens Wikipedia visibles dans le texte comptent.</li>
                <li>Les notes et références (petits chiffres [1]) ne sont pas cliquables.</li>
                <li>Le Ctrl+F est désactivé pendant la partie.</li>
                <li>Abandonner est possible à tout moment — le joueur est marqué comme éliminé.</li>
                <li>Seul l'hôte peut lancer une nouvelle partie depuis la page de résultats.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { GameMode } from '@wiki-race/shared';
import { BINGO_CONSTRAINTS } from '@wiki-race/shared';
import { useRulesModal } from '@/shared/composables/useRulesModal';

const { showRules, closeRules } = useRulesModal();

const modes = [
  {
    value: GameMode.CLASSIC,
    icon: '🏁',
    label: 'Classique',
    description: "Premier à atteindre la page cible gagne. Une limite de temps est optionnelle.",
  },
  {
    value: GameMode.SPRINT,
    icon: '⚡',
    label: 'Sprint',
    description:
      "Même objectif que Classique, mais avec un timer obligatoire. Si le temps s'écoule, la partie se termine sans gagnant.",
  },
  {
    value: GameMode.LABYRINTH,
    icon: '🧩',
    label: 'Labyrinthe',
    description:
      "Atteindre la cible avec un nombre de clics limité. Épuiser ses clics = élimination. Le dernier joueur restant ou le premier à la cible gagne.",
  },
  {
    value: GameMode.DRIFT,
    icon: '🌊',
    label: 'WikiDrift',
    description:
      "Pas de cible ! Chaque joueur navigue librement pour optimiser un score selon l'objectif (page la plus ancienne, la plus courte ou avec le plus d'images). Gagne le meilleur score à épuisement des clics.",
  },
  {
    value: GameMode.BINGO,
    icon: '🎯',
    label: 'Bingo Wiki',
    description:
      "Validez toutes les contraintes choisies en cliquant sur des pages. Premier à toutes les valider gagne. Si les clics s'épuisent, victoire du joueur avec le plus de contraintes validées.",
  },
];

// Constraint explanations (display text — not duplicating shared types)
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
  year_in_title: "Le titre de la page contient une année (ex : Guerre de 1812).",
  biographical: "Page sur une personne — l'infobox doit avoir une ligne \"Naissance\".",
  country: "Page sur un pays ou état — l'infobox mentionne une capitale ou un gentilé.",
  has_main_image: "La page possède une image principale (miniature) dans son infobox.",
  artist: "Page sur un artiste — l'infobox indique chanteur, musicien, acteur, peintre ou artiste.",
  sportsperson: "Page sur un sportif — l'infobox indique son sport.",
  city: "Page sur une commune ou ville — classe infobox \"commune\" ou code postal présent.",
  many_images: "La page contient au moins 10 images réelles (miniatures Wikimedia).",
  film_or_series: "Page sur un film ou une série — l'infobox mentionne un réalisateur ou une chaîne TV.",
  science:
    "L'introduction de l'article mentionne une discipline scientifique (physique, chimie, biologie…).",
};

const constraintDetails = BINGO_CONSTRAINTS.map((c) => ({
  id: c.id,
  label: c.label,
  icon: CONSTRAINT_ICONS[c.id] ?? '•',
  description: CONSTRAINT_DESCRIPTIONS[c.id] ?? '',
}));

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeRules();
}
onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
</script>

<style scoped>
.rules-fade-enter-active,
.rules-fade-leave-active {
  transition: opacity 0.15s ease;
}
.rules-fade-enter-from,
.rules-fade-leave-to {
  opacity: 0;
}
</style>

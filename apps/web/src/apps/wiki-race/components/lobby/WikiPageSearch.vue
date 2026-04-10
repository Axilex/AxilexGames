<template>
  <div class="relative">
    <label class="block text-sm font-medium text-stone-700 mb-1">{{ label }}</label>

    <!-- Selected -->
    <div
      v-if="selected"
      class="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg px-3 py-2"
    >
      <span class="text-amber-800 text-sm font-medium truncate">{{ selected.title }}</span>
      <button
        type="button"
        class="ml-2 text-amber-400 hover:text-amber-700 shrink-0"
        @click="clear"
      >
        ✕
      </button>
    </div>

    <!-- Search input -->
    <div v-else class="relative">
      <input
        v-model="query"
        type="text"
        :placeholder="placeholder ?? 'Rechercher un article Wikipédia...'"
        class="w-full bg-white border border-stone-300 hover:border-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none rounded-lg px-3 py-2 text-stone-900 placeholder-stone-400 text-sm transition-colors"
        @input="onInput"
        @blur="onBlur"
        @focus="showDropdown = results.length > 0"
      />
      <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
        <svg class="animate-spin h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <ul
      v-if="showDropdown && results.length > 0"
      class="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden"
    >
      <li
        v-for="result in results"
        :key="result.slug"
        class="px-3 py-2.5 text-sm text-stone-800 hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors border-b border-stone-100 last:border-0"
        @mousedown.prevent="select(result)"
      >
        {{ result.title }}
      </li>
    </ul>
    <p
      v-if="!selected && query.length > 0 && !loading && results.length === 0 && searched"
      class="mt-1 text-xs text-stone-400"
    >
      Aucun résultat
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? 'http://localhost:3000';

interface WikiResult {
  slug: string;
  title: string;
}

defineProps<{ label: string; placeholder?: string }>();
const emit = defineEmits<{ select: [result: WikiResult | null] }>();

const query = ref('');
const results = ref<WikiResult[]>([]);
const selected = ref<WikiResult | null>(null);
const loading = ref(false);
const showDropdown = ref(false);
const searched = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  searched.value = false;
  showDropdown.value = false;
  if (debounceTimer) clearTimeout(debounceTimer);
  if (query.value.trim().length < 2) {
    results.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  debounceTimer = setTimeout(() => search(query.value.trim()), 350);
}

async function search(q: string) {
  try {
    const res = await fetch(`${API_BASE}/wiki/search?q=${encodeURIComponent(q)}`);
    results.value = (await res.json()) as WikiResult[];
    showDropdown.value = results.value.length > 0;
    searched.value = true;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function select(result: WikiResult) {
  selected.value = result;
  query.value = '';
  results.value = [];
  showDropdown.value = false;
  emit('select', result);
}
function clear() {
  selected.value = null;
  emit('select', null);
}
function onBlur() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}
</script>

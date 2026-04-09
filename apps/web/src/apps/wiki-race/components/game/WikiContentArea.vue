<template>
  <div class="relative h-full">
    <!-- Search blocked toast -->
    <Transition name="fade">
      <div
        v-if="showSearchBlocked"
        class="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-stone-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap"
      >
        🚫 Recherche désactivée pendant la partie
      </div>
    </Transition>

    <!-- Loading overlay -->
    <div
      v-if="isNavigating"
      class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"
    >
      <div class="flex flex-col items-center gap-3">
        <svg
          class="animate-spin h-8 w-8 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
        >
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
        <span class="text-sm text-gray-500 font-medium">Chargement...</span>
      </div>
    </div>

    <!-- eslint-disable vue/no-v-html -->
    <!-- Wikipedia content — HTML sanitized server-side before sending -->
    <div
      ref="containerRef"
      class="wiki-content h-full overflow-y-auto px-8 py-6"
      v-html="htmlContent"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

defineProps<{ htmlContent: string; isNavigating?: boolean }>();
const emit = defineEmits<{ navigate: [slug: string] }>();
const containerRef = ref<HTMLElement | null>(null);
const showSearchBlocked = ref(false);
let searchBlockedTimer: ReturnType<typeof setTimeout> | null = null;

function handleClick(e: MouseEvent) {
  const anchor = (e.target as Element).closest('a[href^="/wiki/"]');
  if (!anchor) return;
  e.preventDefault();
  const href = anchor.getAttribute('href');
  if (!href) return;
  const slug = href.slice(6);
  if (slug) emit('navigate', slug);
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    showSearchBlocked.value = true;
    if (searchBlockedTimer) clearTimeout(searchBlockedTimer);
    searchBlockedTimer = setTimeout(() => { showSearchBlocked.value = false; }, 2000);
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeydown);
  if (searchBlockedTimer) clearTimeout(searchBlockedTimer);
});
</script>

<style>
/* Wikipedia-like content styles */
.wiki-content {
  font-family: -apple-system, 'Linux Libertine', Georgia, Times, serif;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #202122;
  background: white;
}

.wiki-content h1 { font-size: 2rem; font-weight: 400; margin: 0 0 0.5rem; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.25rem; color: #000; font-family: 'Linux Libertine', Georgia, Times, serif; }
.wiki-content h2 { font-size: 1.5rem; font-weight: 400; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.2rem; color: #000; font-family: 'Linux Libertine', Georgia, Times, serif; }
.wiki-content h3 { font-size: 1.2rem; font-weight: 600; margin: 1.25rem 0 0.4rem; color: #000; }
.wiki-content h4 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.25rem; color: #000; }

.wiki-content p { margin: 0 0 0.8rem; }

.wiki-content a[href^="/wiki/"] {
  color: #3366cc;
  text-decoration: none;
  cursor: pointer;
}
.wiki-content a[href^="/wiki/"]:hover {
  text-decoration: underline;
}
.wiki-content a[href^="/wiki/"]:visited {
  color: #795cb2;
}

/* --- Images & Figures --- */
.wiki-content img {
  max-width: 100%;
  height: auto;
  display: block;
}

.wiki-content figure {
  float: right;
  clear: right;
  margin: 0 0 1rem 1.5rem;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  padding: 3px;
  font-size: 0.8rem;
  line-height: 1.4;
  max-width: 300px;
}
.wiki-content figure.mw-halign-left {
  float: left;
  clear: left;
  margin: 0 1.5rem 1rem 0;
}
.wiki-content figure.mw-halign-center,
.wiki-content figure.mw-halign-none {
  float: none;
  clear: both;
  margin: 0 auto 1rem;
}

.wiki-content figcaption {
  padding: 0.3rem 0.4rem 0.2rem;
  font-size: 0.75rem;
  color: #54595d;
  line-height: 1.4;
}

/* --- Tables --- */
.wiki-content table {
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
  max-width: 100%;
}
.wiki-content th, .wiki-content td {
  border: 1px solid #a2a9b1;
  padding: 0.35rem 0.5rem;
  text-align: left;
  vertical-align: top;
}
.wiki-content th {
  background: #eaecf0;
  font-weight: 600;
}
.wiki-content tr:nth-child(even) td { background: #f8f9fa; }

/* Infobox (floated right info panel) */
.wiki-content .infobox,
.wiki-content table.infobox {
  float: right;
  clear: right;
  margin: 0 0 1.5rem 1.5rem;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  font-size: 0.8125rem;
  max-width: 260px;
  border-collapse: collapse;
}
.wiki-content .infobox th,
.wiki-content .infobox td {
  padding: 0.25rem 0.45rem;
}
.wiki-content .infobox img {
  max-width: 100%;
  height: auto;
}

/* Wikitable */
.wiki-content .wikitable {
  background: white;
  border: 1px solid #a2a9b1;
  border-collapse: collapse;
  color: #202122;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.wiki-content .wikitable > * > tr > th,
.wiki-content .wikitable > * > tr > td {
  border: 1px solid #a2a9b1;
  padding: 0.35rem 0.5rem;
  vertical-align: top;
}
.wiki-content .wikitable > * > tr > th {
  background: #eaecf0;
}

/* --- Lists --- */
.wiki-content ul, .wiki-content ol { padding-left: 1.75rem; margin: 0 0 0.8rem; }
.wiki-content li { margin-bottom: 0.2rem; }

/* Definition lists */
.wiki-content dl { margin: 0 0 0.8rem 1rem; }
.wiki-content dt { font-weight: 600; }
.wiki-content dd { margin-left: 1.5rem; margin-bottom: 0.2rem; }

/* --- Inline elements --- */
.wiki-content sup { font-size: 0.7em; vertical-align: super; }
.wiki-content sub { font-size: 0.7em; vertical-align: sub; }
.wiki-content sup a { color: #3366cc; }

.wiki-content b, .wiki-content strong { font-weight: 600; }
.wiki-content i, .wiki-content em { font-style: italic; }
.wiki-content small { font-size: 0.85em; }
.wiki-content s { text-decoration: line-through; }
.wiki-content abbr { text-decoration: underline dotted; cursor: help; }

/* --- Block elements --- */
.wiki-content hr { border: none; border-top: 1px solid #a2a9b1; margin: 1.25rem 0; }
.wiki-content blockquote { margin: 0.5rem 1.5rem; padding-left: 1rem; border-left: 3px solid #a2a9b1; color: #54595d; }

/* Section clearfix so floated infoboxes/images don't bleed across sections */
.wiki-content section::after {
  content: '';
  display: table;
  clear: both;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-6px); }
</style>

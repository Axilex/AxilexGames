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
        <svg class="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
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

    <!-- Wikipedia content — HTML sanitized server-side before sending -->
    <div ref="containerRef" class="wiki-content h-full overflow-y-auto">
      <div class="wiki-inner">
        <!-- Page title -->
        <h1 v-if="title" class="wiki-page-title">
          {{ title }}
        </h1>

        <!-- Generated table of contents -->
        <nav v-if="toc.length >= 3" class="wiki-toc">
          <div class="wiki-toc-title">Sommaire</div>
          <ol class="wiki-toc-list">
            <li v-for="entry in toc" :key="entry.id">
              <a :href="`#${entry.id}`"
                ><span class="tocnumber">{{ entry.number }}</span> {{ entry.text }}</a
              >
              <ol v-if="entry.children.length">
                <li v-for="child in entry.children" :key="child.id">
                  <a :href="`#${child.id}`"
                    ><span class="tocnumber">{{ child.number }}</span> {{ child.text }}</a
                  >
                </li>
              </ol>
            </li>
          </ol>
        </nav>

        <!-- eslint-disable vue/no-v-html -->
        <div v-html="htmlContent" />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

interface TocEntry {
  id: string;
  text: string;
  number: string;
  children: TocEntry[];
}

const props = defineProps<{ htmlContent: string; title?: string; isNavigating?: boolean }>();

const toc = computed<TocEntry[]>(() => {
  if (!props.htmlContent) return [];
  const doc = new DOMParser().parseFromString(props.htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h2[id], h3[id]');
  const result: TocEntry[] = [];
  let h2n = 0;
  let h3n = 0;
  headings.forEach((h) => {
    const id = h.getAttribute('id') ?? '';
    const text = h.textContent?.trim() ?? '';
    if (!id || !text) return;
    if (h.tagName === 'H2') {
      h2n++;
      h3n = 0;
      result.push({ id, text, number: `${h2n}`, children: [] });
    } else if (result.length) {
      h3n++;
      result[result.length - 1].children.push({ id, text, number: `${h2n}.${h3n}`, children: [] });
    }
  });
  return result;
});
const emit = defineEmits<{ navigate: [slug: string] }>();
const containerRef = ref<HTMLElement | null>(null);

watch(
  () => props.htmlContent,
  () => {
    nextTick(() => {
      containerRef.value?.scrollTo({ top: 0, behavior: 'instant' });
    });
  },
);
const showSearchBlocked = ref(false);
let searchBlockedTimer: ReturnType<typeof setTimeout> | null = null;

function handleClick(e: MouseEvent) {
  const anchor = (e.target as Element).closest('a[href^="/wiki/"]');
  if (!anchor) return;
  // Ignore footnote/reference links inside <sup> tags (double protection with backend sanitizer)
  if (anchor.closest('sup')) return;
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
    searchBlockedTimer = setTimeout(() => {
      showSearchBlocked.value = false;
    }, 2000);
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
  background: white;
}

.wiki-inner {
  font-family: -apple-system, 'Linux Libertine', Georgia, Times, serif;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #202122;
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 2rem 3rem;
}

.wiki-inner h1 {
  font-size: 2rem;
  font-weight: 400;
  margin: 0 0 0.5rem;
  border-bottom: 1px solid #a2a9b1;
  padding-bottom: 0.25rem;
  color: #000;
  font-family: 'Linux Libertine', Georgia, Times, serif;
}
.wiki-inner h2 {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 1.5rem 0 0.5rem;
  border-bottom: 1px solid #a2a9b1;
  padding-bottom: 0.2rem;
  color: #000;
  font-family: 'Linux Libertine', Georgia, Times, serif;
}
.wiki-inner h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1.25rem 0 0.4rem;
  color: #000;
}
.wiki-inner h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 1rem 0 0.25rem;
  color: #000;
}

.wiki-inner p {
  margin: 0 0 0.8rem;
}

.wiki-inner a[href^='/wiki/'] {
  color: #3366cc;
  text-decoration: none;
  cursor: pointer;
}
.wiki-inner a[href^='/wiki/']:hover {
  text-decoration: underline;
}
.wiki-inner a[href^='/wiki/']:visited {
  color: #795cb2;
}

/* --- Images & Figures --- */
.wiki-inner img {
  max-width: 100%;
  height: auto;
  display: block;
}

.wiki-inner figure {
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
.wiki-inner figure.mw-halign-left {
  float: left;
  clear: left;
  margin: 0 1.5rem 1rem 0;
}
.wiki-inner figure.mw-halign-center,
.wiki-inner figure.mw-halign-none {
  float: none;
  clear: both;
  margin: 0 auto 1rem;
}

.wiki-inner figcaption {
  padding: 0.3rem 0.4rem 0.2rem;
  font-size: 0.75rem;
  color: #54595d;
  line-height: 1.4;
}

/* --- Tables --- */
.wiki-inner table {
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
  max-width: 100%;
}
.wiki-inner th,
.wiki-inner td {
  border: 1px solid #a2a9b1;
  padding: 0.35rem 0.5rem;
  text-align: left;
  vertical-align: top;
}
.wiki-inner th {
  background: #eaecf0;
  font-weight: 600;
}
.wiki-inner tr:nth-child(even) td {
  background: #f8f9fa;
}

/* Infobox (floated right info panel) */
.wiki-inner .infobox,
.wiki-inner table.infobox {
  float: right;
  clear: right;
  margin: 0 0 1.5rem 1.5rem;
  border: 1px solid #a2a9b1;
  background: #f8f9fa;
  font-size: 0.8125rem;
  max-width: 260px;
  border-collapse: collapse;
}
.wiki-inner .infobox th,
.wiki-inner .infobox td {
  padding: 0.25rem 0.45rem;
}
.wiki-inner .infobox img {
  max-width: 100%;
  height: auto;
}

/* Wikitable */
.wiki-inner .wikitable {
  background: white;
  border: 1px solid #a2a9b1;
  border-collapse: collapse;
  color: #202122;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.wiki-inner .wikitable > * > tr > th,
.wiki-inner .wikitable > * > tr > td {
  border: 1px solid #a2a9b1;
  padding: 0.35rem 0.5rem;
  vertical-align: top;
}
.wiki-inner .wikitable > * > tr > th {
  background: #eaecf0;
}

/* --- Lists --- */
.wiki-inner ul,
.wiki-inner ol {
  padding-left: 1.75rem;
  margin: 0 0 0.8rem;
}
.wiki-inner li {
  margin-bottom: 0.2rem;
}

/* Definition lists */
.wiki-inner dl {
  margin: 0 0 0.8rem 1rem;
}
.wiki-inner dt {
  font-weight: 600;
}
.wiki-inner dd {
  margin-left: 1.5rem;
  margin-bottom: 0.2rem;
}

/* --- Inline elements --- */
.wiki-inner sup {
  font-size: 0.7em;
  vertical-align: super;
}
.wiki-inner sub {
  font-size: 0.7em;
  vertical-align: sub;
}
.wiki-inner sup a {
  color: #3366cc;
}

.wiki-inner b,
.wiki-inner strong {
  font-weight: 600;
}
.wiki-inner i,
.wiki-inner em {
  font-style: italic;
}
.wiki-inner small {
  font-size: 0.85em;
}
.wiki-inner s {
  text-decoration: line-through;
}
.wiki-inner abbr {
  text-decoration: underline dotted;
  cursor: help;
}

/* --- Block elements --- */
.wiki-inner hr {
  border: none;
  border-top: 1px solid #a2a9b1;
  margin: 1.25rem 0;
}
.wiki-inner blockquote {
  margin: 0.5rem 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid #a2a9b1;
  color: #54595d;
}

/* --- Page title --- */
.wiki-page-title {
  font-family: 'Linux Libertine', Georgia, Times, serif;
  font-size: 2rem;
  font-weight: 400;
  color: #000;
  border-bottom: 1px solid #a2a9b1;
  padding-bottom: 0.25rem;
  margin: 0 0 0.75rem;
}

/* --- Generated table of contents --- */
.wiki-toc {
  background: #f8f9fa;
  border: 1px solid #a2a9b1;
  padding: 0.6rem 1.2rem 0.8rem;
  display: inline-block;
  min-width: 180px;
  max-width: 360px;
  margin: 0 0 1.2rem;
  font-size: 0.875rem;
}
.wiki-toc-title {
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #202122;
}
.wiki-toc-list,
.wiki-toc ol {
  margin: 0;
  padding-left: 1.4rem;
}
.wiki-toc li {
  margin-bottom: 0.15rem;
}
.wiki-toc a {
  color: #3366cc;
  text-decoration: none;
}
.wiki-toc a:hover {
  text-decoration: underline;
}
.wiki-toc .tocnumber {
  color: #54595d;
  margin-right: 0.25rem;
}

/* Clearfix at the end of the article so floats don't overflow the container */
.wiki-inner::after {
  content: '';
  display: table;
  clear: both;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}
</style>

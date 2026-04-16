<template>
  <div class="relative w-full rounded-2xl overflow-hidden bg-stone-900" style="aspect-ratio: 4/3">
    <transition name="fade">
      <img
        v-if="visible"
        :src="imageUrl"
        :alt="alt"
        class="w-full h-full object-cover select-none pointer-events-none"
        :style="{ filter: blurred ? `blur(${blurPx}px)` : 'none', transition: 'filter 0.5s ease' }"
        draggable="false"
      />
    </transition>

    <!-- Countdown bar -->
    <div
      v-if="visible && !blurred"
      class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20"
    >
      <div
        class="h-full bg-white transition-none"
        :style="{ width: `${progressPct}%`, transition: `width ${revealDurationMs}ms linear` }"
      />
    </div>

    <!-- Hidden overlay -->
    <div
      v-if="!visible"
      class="absolute inset-0 flex items-center justify-center bg-stone-800"
    >
      <span class="text-4xl select-none">✍️</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  imageUrl: string;
  revealDurationMs: number;
}>();

const emit = defineEmits<{ imageHidden: [] }>();

const alt = 'Photo à décrire';
const visible = ref(true);
const blurred = ref(false);
const blurPx = ref(0);
const progressPct = ref(100);

let revealTimeout: ReturnType<typeof setTimeout> | null = null;
let blurInterval: ReturnType<typeof setInterval> | null = null;

function startReveal(): void {
  visible.value = true;
  blurred.value = false;
  blurPx.value = 0;
  progressPct.value = 100;

  // Start countdown bar — it goes from 100 to 0 over revealDurationMs
  // Done purely via CSS transition trick: set to 0 after a microtask
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      progressPct.value = 0;
    });
  });

  revealTimeout = setTimeout(() => {
    // Blur animation
    blurred.value = true;
    let blur = 0;
    blurInterval = setInterval(() => {
      blur += 4;
      blurPx.value = blur;
      if (blur >= 20) {
        clearInterval(blurInterval!);
        visible.value = false;
        emit('imageHidden');
      }
    }, 60);
  }, props.revealDurationMs);
}

onMounted(startReveal);

watch(
  () => props.imageUrl,
  () => {
    if (revealTimeout) clearTimeout(revealTimeout);
    if (blurInterval) clearInterval(blurInterval);
    startReveal();
  },
);

onUnmounted(() => {
  if (revealTimeout) clearTimeout(revealTimeout);
  if (blurInterval) clearInterval(blurInterval);
});
</script>

<style scoped>
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>

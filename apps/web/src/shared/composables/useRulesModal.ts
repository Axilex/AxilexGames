import { ref } from 'vue';

// Module-level singleton — all callers share the same ref
const showRules = ref(false);

export function useRulesModal() {
  function openRules() {
    showRules.value = true;
  }
  function closeRules() {
    showRules.value = false;
  }
  return { showRules, openRules, closeRules };
}

<template>
  <div>
    <BaseButton
      v-if="!confirming"
      variant="ghost"
      size="sm"
      class="text-red-500 hover:text-red-600 hover:bg-red-50"
      @click="confirming = true"
    >
      Abandonner
    </BaseButton>
    <div v-else class="flex items-center gap-2">
      <span class="text-xs text-red-600 font-medium">Confirmer ?</span>
      <BaseButton
        variant="danger"
        size="sm"
        @click="
          emit('surrender');
          confirming = false;
        "
      >
        Oui
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="confirming = false"> Non </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const emit = defineEmits<{ surrender: [] }>();
const confirming = ref(false);
</script>

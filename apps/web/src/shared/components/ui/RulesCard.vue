<template>
  <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
    <div class="px-4 py-2.5 border-b border-border flex items-center gap-2">
      <span class="text-sm">📖</span>
      <span class="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest">Règles</span>
    </div>

    <div class="px-4 py-3 flex flex-col gap-3">
      <div v-for="section in sections" :key="section.title" class="flex flex-col gap-1.5">
        <p class="text-[10px] font-semibold text-foreground-subtle uppercase tracking-widest">
          {{ section.title }}
        </p>

        <!-- Icon + label + description items -->
        <div v-if="section.items" class="flex flex-col gap-1.5">
          <div v-for="item in section.items" :key="item.label" class="flex gap-1.5 items-start">
            <span class="shrink-0 text-xs leading-tight mt-px">{{ item.icon }}</span>
            <div class="text-[10px] leading-tight">
              <span class="font-semibold text-foreground-muted">{{ item.label }}</span>
              <span class="text-foreground-subtle"> — {{ item.description }}</span>
            </div>
          </div>
        </div>

        <!-- Bullet list -->
        <ul
          v-else-if="section.bullets"
          class="text-[10px] text-foreground-muted flex flex-col gap-0.5 list-disc list-inside"
        >
          <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface RuleItem {
  icon: string;
  label: string;
  description: string;
}

export interface RuleSection {
  title: string;
  items?: RuleItem[];
  bullets?: string[];
}

defineProps<{ sections: RuleSection[] }>();
</script>

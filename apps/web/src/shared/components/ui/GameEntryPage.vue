<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <AppNav />

    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md flex flex-col gap-5">
        <!-- Header -->
        <div class="text-center mb-2">
          <div
            :class="`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${gradientClasses} rounded-2xl mb-4 shadow-md ${iconShadowClass}`"
          >
            <slot name="icon" />
          </div>
          <h1 class="text-3xl font-bold text-stone-900 tracking-tight">{{ title }}</h1>
          <p class="text-stone-500 mt-1 text-sm">{{ subtitle }}</p>
        </div>

        <ErrorToast :message="error ?? ''" />

        <!-- Shared pseudo -->
        <BaseInput
          v-model="pseudo"
          label="Ton pseudo"
          placeholder="ex : Alice"
          :maxlength="pseudoMaxlength"
          :error="pseudoError"
          size="lg"
          @enter="handleJoin"
        />

        <!-- Join room (first) -->
        <div
          :class="[
            'rounded-2xl p-6 border shadow-sm flex flex-col gap-4',
            hasInviteCode
              ? 'bg-amber-50 border-amber-300 shadow-amber-100'
              : 'bg-white border-stone-200',
          ]"
        >
          <div class="flex items-center gap-2">
            <span v-if="hasInviteCode" class="text-lg leading-none">🎉</span>
            <h2
              :class="[
                'text-base font-semibold',
                hasInviteCode ? 'text-amber-900' : 'text-stone-800',
              ]"
            >
              {{ hasInviteCode ? 'Vous avez été invité !' : 'Rejoindre une room' }}
            </h2>
          </div>

          <!-- Prominent code display when arriving via invite link -->
          <div
            v-if="hasInviteCode"
            class="bg-white rounded-xl border border-amber-200 px-4 py-3 text-center"
          >
            <span class="text-2xl font-bold tracking-[0.3em] font-mono text-stone-900">
              {{ joinCode }}
            </span>
          </div>

          <BaseInput
            v-model="joinCode"
            :label="hasInviteCode ? 'Modifier le code' : 'Code de la room'"
            placeholder="ex : ABCDEF"
            :maxlength="6"
            :error="joinCodeError"
            class="font-mono uppercase"
            @enter="handleJoin"
          />
          <BaseButton
            :variant="hasInviteCode ? 'primary' : 'secondary'"
            :loading="joining"
            class="w-full"
            @click="handleJoin"
          >
            Rejoindre →
          </BaseButton>
        </div>

        <!-- Divider — hidden when arriving via invite (create is just a text link) -->
        <div v-if="!hasInviteCode" class="flex items-center gap-3">
          <div class="flex-1 h-px bg-stone-200" />
          <span class="text-xs text-stone-400 font-medium">ou</span>
          <div class="flex-1 h-px bg-stone-200" />
        </div>

        <!-- Create room (second) — collapsed when arriving via invite link -->
        <div
          v-if="!hasInviteCode"
          class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-4"
        >
          <h2 class="text-base font-semibold text-stone-800">Créer une room</h2>
          <BaseButton :loading="creating" class="w-full" @click="handleCreate">
            Créer une room →
          </BaseButton>
        </div>
        <div v-else class="text-center">
          <button
            class="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            :disabled="creating"
            @click="handleCreate"
          >
            {{ creating ? 'Création…' : 'ou créer une nouvelle room' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppNav from './AppNav.vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import ErrorToast from './ErrorToast.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    gradientClasses: string;
    iconShadowClass: string;
    error?: string | null;
    room?: Record<string, unknown> | null;
    /** If provided, the router will push to this named route when the room appears. */
    lobbyRouteName?: string;
    pseudoMaxlength?: number;
    initialPseudo?: string;
  }>(),
  {
    error: null,
    room: null,
    lobbyRouteName: undefined,
    pseudoMaxlength: 20,
    initialPseudo: '',
  },
);

const emit = defineEmits<{
  join: [code: string, pseudo: string];
  create: [pseudo: string];
}>();

const router = useRouter();

const pseudo = ref(props.initialPseudo);
const joinCode = ref('');
const pseudoError = ref('');
const joinCodeError = ref('');
const creating = ref(false);
const joining = ref(false);

const params = new URLSearchParams(window.location.search);
const urlCode = params.get('code');
const urlAutoJoin = params.get('autoJoin');
if (urlCode) joinCode.value = urlCode.toUpperCase();
const hasInviteCode = !!urlCode;

onMounted(() => {
  if (urlCode && urlAutoJoin && pseudo.value) {
    handleJoin();
  }
});

watch(
  () => props.room,
  (room) => {
    if (room) {
      creating.value = false;
      joining.value = false;
      if (props.lobbyRouteName) void router.push({ name: props.lobbyRouteName });
    }
  },
);

watch(
  () => props.error,
  () => {
    creating.value = false;
    joining.value = false;
  },
);

function handleJoin(): void {
  pseudoError.value = '';
  joinCodeError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  if (joinCode.value.trim().length < 6) {
    joinCodeError.value = 'Le code doit faire 6 caractères.';
    return;
  }
  joining.value = true;
  emit('join', joinCode.value.trim().toUpperCase(), pseudo.value.trim());
}

function handleCreate(): void {
  pseudoError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  creating.value = true;
  emit('create', pseudo.value.trim());
}
</script>

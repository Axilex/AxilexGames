import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSocketStore = defineStore('socket', () => {
  const isConnected = ref(false);
  const isReconnecting = ref(false);
  const hasConnectedOnce = ref(false);
  const pendingRejoin = ref(false);

  function setConnected(value: boolean): void {
    isConnected.value = value;
    if (value) {
      hasConnectedOnce.value = true;
      isReconnecting.value = false;
    }
  }

  function setReconnecting(value: boolean): void {
    isReconnecting.value = value;
  }

  function setPendingRejoin(value: boolean): void {
    pendingRejoin.value = value;
  }

  return {
    isConnected,
    isReconnecting,
    hasConnectedOnce,
    pendingRejoin,
    setConnected,
    setReconnecting,
    setPendingRejoin,
  };
});

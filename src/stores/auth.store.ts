import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);

  async function fetchToken() {
    const response = await fetch('/csrf-token');
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    const tokenData = await response.json();
    token.value = tokenData.token;
  }

  return { token, fetchToken };
});

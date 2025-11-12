import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useAuthStore } from './stores/auth.store';
import { Toast } from './components/Toast';

import './styles/main.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';

async function initializeApp() {
  // Initialize Toast
  Toast.options({
    positionClass: 'toast-top-center',
    closeButton: false,
    showDuration: 250,
    hideDuration: 250,
    timeOut: 4000,
    extendedTimeOut: 10000,
    escapeHtml: true,
  });

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // Fetch CSRF token before mounting
  try {
    const authStore = useAuthStore();
    await authStore.fetchToken();
  } catch (error) {
    Toast.error("Couldn't get CSRF token. Please refresh the page.", 'Error', {
      timeOut: 0,
      extendedTimeOut: 0,
      preventDuplicates: true,
    });
    console.error('Initialization failed:', error);
    // Prevent the app from mounting on critical error
    return;
  }

  app.mount('#app');
}

initializeApp();

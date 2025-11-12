import { useAuthStore } from '../stores/auth.store';

export function getRequestHeaders({ omitContentType = false } = {}) {
  // Pinia stores must be instantiated within the function call
  // to ensure they are accessed after Pinia is initialized.
  const authStore = useAuthStore();
  const tokenValue = authStore.token;

  if (!tokenValue) {
    throw new Error('CSRF token is not set');
  }

  const headers: {
    'Content-Type'?: string;
    'X-CSRF-Token': string;
  } = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': tokenValue,
  };

  if (omitContentType) {
    delete headers['Content-Type'];
  }

  return headers;
}

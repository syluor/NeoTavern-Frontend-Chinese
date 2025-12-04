import { onMounted, onUnmounted, ref } from 'vue';
import { isViewportMobile } from '../utils/client';

/**
 * A reactive composable to track if the viewport is mobile.
 * Updates automatically on window resize.
 */
export function useMobile() {
  const isMobile = ref(isViewportMobile());

  function handleResize() {
    const newVal = isViewportMobile();
    if (newVal !== isMobile.value) {
      isMobile.value = newVal;
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    // Check once on mount to be sure
    handleResize();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return { isMobile };
}

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PopupOptions } from '../types';
import { POPUP_TYPE, POPUP_RESULT } from '../types';
import { uuidv4 } from '../utils/common';

interface PopupState extends PopupOptions {
  id: string;
  visible: boolean;
  title: string;
  content: string;
  type: POPUP_TYPE;
  inputValue?: string;
}

interface PopupPromise {
  resolve: (payload: { result: number; value: any }) => void;
  reject: (reason?: any) => void;
}

export type PopupShowOptions = Partial<Omit<PopupState, 'id' | 'visible'>>;

export const usePopupStore = defineStore('popup', () => {
  const popups = ref<PopupState[]>([]);
  const promises = ref<Record<string, PopupPromise>>({});

  function show(options: PopupShowOptions): Promise<{ result: number; value: any }> {
    const id = uuidv4();
    const newPopup: PopupState = {
      id,
      visible: true,
      title: '',
      content: '',
      type: POPUP_TYPE.TEXT,
      inputValue: '',
      ...options,
    };

    popups.value.push(newPopup);

    return new Promise((resolve, reject) => {
      promises.value[id] = { resolve, reject };
    });
  }

  function hide(id: string) {
    const index = popups.value.findIndex((p) => p.id === id);
    if (index > -1) {
      popups.value.splice(index, 1);
    }
    delete promises.value[id];
  }

  function confirm(id: string, payload: { result: number; value: any }) {
    promises.value[id]?.resolve(payload);
    hide(id);
  }

  function cancel(id: string) {
    promises.value[id]?.resolve({ result: POPUP_RESULT.CANCELLED, value: null });
    hide(id);
  }

  return {
    popups,
    show,
    confirm,
    cancel,
  };
});

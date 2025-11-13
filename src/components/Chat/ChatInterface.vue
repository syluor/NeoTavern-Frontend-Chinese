<script setup lang="ts">
import { useChatStore } from '../../stores/chat.store';
import ChatMessage from './ChatMessage.vue';

const chatStore = useChatStore();
</script>

<template>
  <div class="chat-interface">
    <div class="chat-interface__messages">
      <ChatMessage v-for="(message, index) in chatStore.chat" :key="index" :message="message" :index="index" />
    </div>
    <div class="chat-interface__form-container">
      <form class="chat-form">
        <div class="chat-form__inner">
          <div class="chat-form__actions-left">
            <button type="button" class="chat-form__button fa-solid fa-bars" :title="$t('chat.options')"></button>
            <button
              type="button"
              class="chat-form__button fa-solid fa-magic-wand-sparkles"
              :title="$t('chat.extensions')"
            ></button>
          </div>
          <textarea id="chat-input" :placeholder="$t('chat.inputPlaceholder')" autocomplete="off"></textarea>
          <div class="chat-form__actions-right">
            <button
              type="button"
              class="chat-form__button fa-fw fa-solid fa-arrow-right"
              :title="$t('chat.continue')"
            ></button>
            <button type="button" class="chat-form__button fa-solid fa-paper-plane" :title="$t('chat.send')"></button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

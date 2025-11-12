<script setup lang="ts">
// Chat logic will be added here
</script>

<template>
  <div id="sheld">
    <div class="chat"><!-- Chat messages will be rendered here --></div>
    <div class="form-sheld">
      <div class="send-form">
        <div class="form-items">
          <div class="left-send-form">
            <div id="options-button" class="fa-solid fa-bars"></div>
            <div
              id="extensions-menu-button"
              style="display: flex"
              class="fa-solid fa-magic-wand-sparkles"
              title="Extensions"
            ></div>
          </div>
          <textarea id="send-textarea" placeholder="Type a message, or /? for help" autocomplete="off"></textarea>
          <div class="right-send-form">
            <div id="mes-continue" class="fa-fw fa-solid fa-arrow-right" title="Continue the last message"></div>
            <div id="send-but" class="fa-solid fa-paper-plane" title="Send a message"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
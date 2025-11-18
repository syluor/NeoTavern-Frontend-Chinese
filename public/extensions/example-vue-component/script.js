SillyTavern.registerExtension('example-vue-component', (extensionName, api) => {
  console.log('Loading Example Vue Component extension...');

  const { createApp, ref, onMounted } = SillyTavern.vue;
  const { chat, ui, settings } = api;

  // Define the Vue component for the extension's main UI
  const MyComponent = {
    setup() {
      const messageToSend = ref('');
      // Use the scoped settings API to get and set the extension's own profile choice
      const selectedProfile = ref(settings.get('translatorProfile'));
      // Use the global settings reader to react to application state
      const sendOnEnterSetting = ref(settings.getGlobal('chat.sendOnEnter'));

      function sendMessage() {
        if (!messageToSend.value.trim()) {
          ui.showToast('Please enter a message.', 'warning');
          return;
        }
        chat.sendMessage(messageToSend.value);
        messageToSend.value = '';
      }

      function onProfileChange(newProfileName) {
        selectedProfile.value = newProfileName;
        settings.set('translatorProfile', newProfileName);
        ui.showToast(`Translator profile set to: ${newProfileName || 'None'}`, 'info');
      }

      onMounted(() => {
        // Find the container where we will mount the standard component
        const profileSelectorContainer = document.getElementById('profile-selector-container');
        if (profileSelectorContainer) {
          // Ask the main app to mount its standard ConnectionProfileSelector component for us
          ui.mountComponent(profileSelectorContainer, 'ConnectionProfileSelector', {
            modelValue: selectedProfile.value,
            'onUpdate:modelValue': onProfileChange,
          });
        }
      });

      return {
        messageToSend,
        sendOnEnterSetting,
        sendMessage,
      };
    },
    template: `
      <div class="example-vue-component extension_container">
        <div class="inline-drawer-header"><b>Vue Component Example</b></div>
        <div class="inline-drawer-content">
            <p>This demonstrates mounting standard UI and reading global app settings.</p>
            <p>Global "Send on Enter" setting: <code>{{ sendOnEnterSetting }}</code></p>

            <div class="form-group">
                <label>LLM Profile for Translation (Standard Component):</label>
                <!-- This container will be populated by ui.mountComponent -->
                <div id="profile-selector-container"></div>
            </div>

            <div class="form-group">
                <label>Send a message to the chat:</label>
                <div class="input-with-button">
                  <input type="text" class="text-pole" v-model="messageToSend" @keydown.enter="sendMessage" placeholder="Type here..." />
                  <button class="menu-button" @click="sendMessage">Send</button>
                </div>
            </div>
        </div>
      </div>
    `,
  };

  // Find the extension's main container and mount its Vue component
  const interval = setInterval(() => {
    const container = document.getElementById('example-vue-component_container');
    if (container) {
      clearInterval(interval);
      if (container.childElementCount > 0) return;

      createApp(MyComponent).mount(container);
      console.log('Example Vue Component extension loaded and mounted.');
    }
  }, 100);
});

SillyTavern.registerExtension('example-button', (extensionName, api) => {
  console.log('Loading Example Button extension...');
  const { character, ui, settings } = api;

  // --- Part 1: Add button to the Character Panel (original functionality) ---
  const charPanelInterval = setInterval(() => {
    const container = document.getElementById('extension-buttons-container');
    if (container) {
      clearInterval(charPanelInterval);
      if (!document.getElementById('example-ext-button')) {
        const button = document.createElement('div');
        button.id = 'example-ext-button';
        button.className = 'menu-button fa-solid fa-flask';
        button.title = 'Example Extension Button';
        button.onclick = () => {
          const char = character.getActive();
          const charName = char ? char.name : 'no one';
          ui.showToast(`Button clicked! Active character is ${charName}.`, 'info');
        };
        container.appendChild(button);
      }
    }
  }, 100);

  // --- Part 2: Add settings UI to the Extensions Panel ---
  const settingsPanelInterval = setInterval(() => {
    const settingsContainer = document.getElementById('example-button_container');
    if (settingsContainer) {
      clearInterval(settingsPanelInterval);
      if (settingsContainer.childElementCount > 0) return;

      const settingsDiv = document.createElement('div');
      settingsDiv.innerHTML = `
        <div class="extension_container">
            <div class="inline-drawer-header">
                <b>Example Button Settings</b>
            </div>
            <div class="inline-drawer-content">
                <p>This is the dedicated settings panel for the "Example Button" extension.</p>
                <p>You can add any HTML content here. Your settings are automatically namespaced.</p>
                <div class="range-block">
                    <div class="range-block-title">A Sample Setting</div>
                    <input id="example-button-setting-input" type="text" class="text-pole" placeholder="Enter some value..."/>
                </div>
                <button id="example-button-save-button" class="menu-button menu-button--confirm">Save Setting</button>
            </div>
        </div>
      `;
      settingsContainer.appendChild(settingsDiv);

      const input = document.getElementById('example-button-setting-input');

      // Load saved setting
      const savedValue = settings.get('sampleValue');
      if (savedValue) {
        input.value = savedValue;
      }

      // Add interactivity to the new elements
      document.getElementById('example-button-save-button').addEventListener('click', () => {
        const value = input.value;
        // Use the scoped settings API
        settings.set('sampleValue', value);
        ui.showToast(`Scoped setting saved: ${value}`, 'success');
      });

      console.log('Example Button extension loaded its settings panel.');
    }
  }, 100);
});

import type { SettingDefinition } from './types';
import { SendOnEnterOptions } from './constants';

export const settingsDefinition: SettingDefinition[] = [
  // --- Character Handling ---
  {
    id: 'power_user.spoiler_free_mode',
    label: 'Spoiler Free Mode',
    description: 'Hide character definitions from the editor panel behind a spoiler button.',
    category: 'Character Handling',
    type: 'boolean',
    widget: 'checkbox',
    defaultValue: false,
  },
  {
    id: 'power_user.never_resize_avatars',
    label: 'Never resize avatars',
    description: 'Avoid cropping and resizing imported character images. Disables the upload cropping popup.',
    category: 'Character Handling',
    type: 'boolean',
    widget: 'checkbox',
    defaultValue: false,
  },

  // --- Chat/Message Handling ---
  {
    id: 'power_user.send_on_enter',
    label: 'Enter to Send',
    description: 'Determines if the Enter key sends a message.',
    category: 'Chat/Message Handling',
    type: 'enum',
    widget: 'select',
    defaultValue: SendOnEnterOptions.AUTO,
    options: [
      { value: SendOnEnterOptions.DISABLED, label: 'Disabled' },
      { value: SendOnEnterOptions.AUTO, label: 'Automatic (PC)' },
      { value: SendOnEnterOptions.ENABLED, label: 'Enabled' },
    ],
  },
  {
    id: 'power_user.auto_fix_generated_markdown',
    label: 'Auto-fix Markdown',
    description: 'Automatically attempt to fix malformed markdown in AI-generated messages.',
    category: 'Chat/Message Handling',
    type: 'boolean',
    widget: 'checkbox',
    defaultValue: false,
  },
  {
    id: 'power_user.world_import_dialog',
    label: 'Lorebook Import Dialog',
    description: 'Ask to import World Info for new characters. If unchecked, a brief message will be shown instead.',
    category: 'Chat/Message Handling',
    type: 'boolean',
    widget: 'checkbox',
    defaultValue: true,
  },
];
